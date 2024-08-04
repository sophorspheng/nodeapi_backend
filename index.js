const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const path = require('path');
const app = express();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
});

cloudinary.config({
    cloud_name: 'dqam4so8m',
    api_key: '923626278262269',
    api_secret: 'rbm0iP7OzeXFC5H2p2zk5ZmV_s0'
  });
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg'],
    },
  });
  const upload = multer({ storage: storage });
  app.post('/upload', upload.single('image'), (req, res) => {
    const { name } = req.body;
    const imageUrl = req.file.path; // URL of the uploaded image on Cloudinary
  
    const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
    connection.query(query, [name, imageUrl], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error' });
      }
  
      res.json({ id: results.insertId, name, image_path: imageUrl });
    });
  });
// API endpoint to get form data including image URL
app.get('/data', (req, res) => {
    const query = 'SELECT id, name, image_path FROM forms';
    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query error' });
        }

        // Construct the full URL to the image
        const data = results.map(row => ({
            id: row.id,
            name: row.name,
            image: `https://${req.headers.host}/images/${row.image_path}` // Construct full URL
        }));

        res.json(data);
    });
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;

    // Fetch the image path from the database
    const selectQuery = 'SELECT image_path FROM forms WHERE id = ?';

    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('Record not found');
        }

        const imagePath = results[0].image_path;
        console.log('Retrieved imagePath:', imagePath);

        // Check if imagePath is valid
        if (!imagePath) {
            return res.status(500).send('Image path not found in the database');
        }

        const fullImagePath = path.join(__dirname, 'public/images', imagePath);
        console.log('Full image path:', fullImagePath);

        // Delete the image file
        fs.unlink(fullImagePath, (err) => {
            if (err) {
                console.error('File deletion error:', err);
                return res.status(500).send('Failed to delete image');
            }

            // Now delete the record from the database
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

// Use environment variable for port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
