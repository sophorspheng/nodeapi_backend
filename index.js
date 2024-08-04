const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const app = express();

// Initialize Cloudinary
cloudinary.config({
    cloud_name: "dqam4so8m",
    api_key: "923626278262269",
    api_secret: "rbm0iP7OzeXFC5H2p2zk5ZmV_s0"
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
});

app.post('/upload', upload.single('image'), (req, res) => {
    const { name } = req.body;
    const imageUrl = req.file.path; // The URL of the uploaded image on Cloudinary

    const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
    db.query(query, [name, imageUrl], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query error' });
        }

        res.json({ id: results.insertId, name, image: imageUrl });
    });
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
        const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public ID

        // Delete the image from Cloudinary
        cloudinary.uploader.destroy(publicId, (error) => {
            if (error) {
                console.error('Cloudinary deletion error:', error);
                return res.status(500).send('Failed to delete image from Cloudinary');
            }

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
