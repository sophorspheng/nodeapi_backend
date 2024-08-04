const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const app = express();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
cloudinary.config({
    cloud_name: "dqam4so8m",
    api_key: "923626278262269",
    api_secret: "rbm0iP7OzeXFC5H2p2zk5ZmV_s0"
});
const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;   
const imageUrl = 'https://res.cloudinary.com/dqam4so8m/image/upload/v1722740390/cbz0kuoi6ufd2gkklqme.jpg';
const publicId = imageUrl.split('/').pop().split('.')[0];

const upload = multer({
    storage: multer.memoryStorage() // Use memory storage to upload images to Cloudinary
});


app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
});
app.post('/upload', upload.single('image'), (req, res) => {
    const { name } = req.body;

    cloudinary.uploader.upload_stream((error, result) => {
        if (error) {
            return res.status(500).json({ error: 'Image upload error' });
        }

        const imageUrl = result.secure_url;

        const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
        db.query(query, [name, imageUrl], (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Database query error' });
            }

            res.json({ id: results.insertId, name, image: imageUrl });
        });
    }).end(req.file.buffer);
});

// app.post('/upload', upload.single('image'), (req, res) => {
//     const { name } = req.body;
//     const imagePath = req.file.filename; // The filename of the uploaded image

//     const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
//     db.query(query, [name, imagePath], (error, results) => {
//         if (error) {
//             return res.status(500).json({ error: 'Database query error' });
//         }

//         res.json({ id: results.insertId, name, image: `https://${req.headers.host}/images/${imagePath}` });
//     });
// });

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
            image: row.image_path // Construct full URL
        }));

        res.json(data);
    });
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;

    // Fetch the image URL from the database
    const selectQuery = 'SELECT image_url FROM forms WHERE id = ?';

    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(404).send('Record not found');
        }

        const imageUrl = results[0].image_url;
        console.log('Retrieved imageUrl:', imageUrl);

        // Extract the public ID of the image from the URL
        const publicId = imageUrl.split('/').pop().split('.')[0];
        console.log('Extracted public ID:', publicId);

        // Create the signature for the Cloudinary request
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = crypto
            .createHash('sha1')
            .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
            .digest('hex');

        // Create the URL for the Cloudinary API
        const url = `https://res.cloudinary.com/dqam4so8m/${cloudName}/image/destroy`;

        // Send a POST request to Cloudinary to delete the image
        axios.post(url, {
            public_id: publicId,
            timestamp: timestamp,
            api_key: "923626278262269",
            signature: signature
        })
        .then(response => {
            console.log('Cloudinary deletion response:', response.data);

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
        })
        .catch(error => {
            console.error('Cloudinary deletion error:', error);
            return res.status(500).send('Failed to delete image');
        });
    });
});

// Use environment variable for port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
