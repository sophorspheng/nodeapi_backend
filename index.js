const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const db = require('./config/db');
const app = express();

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get("/", (req, res) => {
    res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
});
///like
// Fetch the like count for a specific form
// app.get('/api/forms/:id/like-count', (req, res) => {
//   const { id } = req.params;
//   db.query('SELECT like_count FROM forms WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Form not found' });
//     }
//     res.json({ like_count: results[0].like_count });
//   });
// });

// // Like a form
// app.post('/api/forms/:id/like', (req, res) => {
//   const { id } = req.params;
//   db.query('UPDATE forms SET like_count = like_count + 1 WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     res.status(200).json({ message: 'Form liked' });
//   });
// });

// // Unlike a form
// app.post('/api/forms/:id/unlike', (req, res) => {
//   const { id } = req.params;
//   db.query('UPDATE forms SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     res.status(200).json({ message: 'Form unliked' });
//   });
// });


///add more
// Like a form
// Like a form
app.post('/api/forms/:id/likes', (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId; // Ensure this is being sent

  // Check if the user has already liked this form
  db.query('SELECT * FROM user_likes WHERE user_id = ? AND form_id = ?', [userId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'User has already liked this form' });
    }

    // Insert a new like into the `user_likes` table
    db.query('INSERT INTO user_likes (user_id, form_id) VALUES (?, ?)', [userId, id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }

      // Increment the like count in the `forms` table
      db.query('UPDATE forms SET like_count = like_count + 1 WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json({ message: 'Form liked' });
      });
    });
  });
});


// Unlike a form
app.post('/api/forms/:id/unlikes', (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId; // Ensure this is being sent

  // Remove the like from the `user_likes` table
  db.query('DELETE FROM user_likes WHERE user_id = ? AND form_id = ?', [userId, id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error' });
    }

    // Decrement the like count in the `forms` table
    db.query('UPDATE forms SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }
      res.status(200).json({ message: 'Form unliked' });
    });
  });
});


///like
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = app;
