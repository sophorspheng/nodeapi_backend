const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const app = express();

// Initialize Cloudinary
cloudinary.config({
    cloud_name: 'dqam4so8m',
    api_key: '923626278262269',
    api_secret: 'rbm0iP7OzeXFC5H2p2zk5ZmV_s0'
  });
  
  const storage = multer.memoryStorage(); // Store file in memory
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
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received for upload:', file.originalname); // Debug log

    // Configure Cloudinary upload options
    const uploadOptions = {
        folder: 'image',
        resource_type: 'image',
        public_id: file.originalname.split('.')[0], // Use the file name without extension
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ error: 'Cloudinary upload error' });
        }

        const imageUrl = result.secure_url; // Cloudinary URL of the uploaded image

        console.log('Image uploaded to Cloudinary:', imageUrl); // Debug log

        const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
        db.query(query, [name, imageUrl], (error, results) => {
            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({ error: 'Database query error' });
            }

            console.log('Image data inserted into database:', {
                id: results.insertId,
                name,
                image: imageUrl
            }); // Debug log

            res.json({ id: results.insertId, name, image: imageUrl });
        });
    }).end(file.buffer); // End the stream with the file buffer
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
        // Example: https://res.cloudinary.com/demo/image/upload/v1611234567/image.jpg
        // public_id: image/upload/v1611234567/image
        const imagePathParts = imageUrl.split('/upload/');
        const publicId = imagePathParts[1].split('.')[0]; // Extract the public_id without the extension

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
