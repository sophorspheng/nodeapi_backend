const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const app = express();

// Initialize Cloudinary
cloudinary.config({
    cloud_name: 'dqam4so8m',
    api_key: '923626278262269',
    api_secret: 'rbm0iP7OzeXFC5H2p2zk5ZmV_s0'
});

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
});

// Configure multer storage
const storage = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload endpoint
app.post('/upload', upload.array('images', 10), async (req, res) => {
    try {
        let imageUrls = [];
        
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'image'
            });
            imageUrls.push(result.secure_url);
        }

        // Store image URLs in MySQL database
        const imageRecords = imageUrls.map(url => [url]);
        const query = 'INSERT INTO images (image_path) VALUES ?';

        db.query(query, [imageRecords], (error, results) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            res.status(200).json({ urls: imageUrls });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get form data including image URL
app.get('/data', (req, res) => {
    const query = 'SELECT id, name, image_path FROM forms';
    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query error' });
        }

        const data = results.map(row => ({
            id: row.id,
            name: row.name,
            image: row.image_path // Already a full URL
        }));

        res.json(data);
    });
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;

    // Query to fetch the image path from the database
    const selectQuery = 'SELECT image_path FROM forms WHERE id = ?';

    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('Record not found');
        }

        const imageUrl = results[0].image_path;

        // Extract the public ID including the folder structure
        const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];

        // Delete the image from Cloudinary
        cloudinary.uploader.destroy(publicId, (error) => {
            if (error) {
                console.error('Cloudinary deletion error:', error);
                return res.status(500).send('Failed to delete image from Cloudinary');
            }

            // Delete the record from the database
            const deleteQuery = 'DELETE FROM forms WHERE id = ?';

            db.query(deleteQuery, [id], (err, result) => {
                if (err) {
                    console.error('Database deletion error:', err);
                    return res.status(500).send('Server error');
                }

                if (result.affectedRows === 0) {
                    return res.status(404).send('Record not found');
                }

                res.send('Record and image deleted successfully');
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
