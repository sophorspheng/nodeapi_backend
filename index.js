const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mysql = require('mysql');
const db = require('./config/db');
const path = require('path');
const app = express();
const port = 3000;
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'public/images/' });
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(bodyParser.json());



app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my api services any problems contact me via email: sophorspheng.num@gmail.com");
});
app.post('/upload', upload.single('image'), (req, res) => {
    const { name } = req.body;
    const imagePath = req.file.filename; // The filename of the uploaded image
  
    const query = 'INSERT INTO forms (name, image_path) VALUES (?, ?)';
    db.query(query, [name, imagePath], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error' });
      }
  
      res.json({ id: results.insertId, name, image: `http://localhost:${PORT}/images/${imagePath}` });
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
        image: `http://localhost:${PORT}/images/${row.image_path}` // Construct full URL
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

        // Check if imagePath is validus
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

// Remove the following lines as Vercel handles the port internally
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// app.listen(port, () => {
//     console.log(`Server is running at http://localhost:${port}`);
//   });
  
module.exports = app;