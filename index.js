const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin')
const serviceAccount = require('./mobileapp-76bf0-firebase-adminsdk-djh1m-6faea1d649.json')
const webpush = require("web-push")
// import express, { json } from "express";
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const authenticateToken = require('./middleware/authenticateJWT')
const reportImage = require('./middleware/reportImage'); 
const notifyAdmin = require('./middleware/notifyAdmin')
const pool = require('./config/db');
const db = require('./config/db');
const app = express();
// const publicVapidKey  = 'BCgJqWRVIM3B2lyWqILZ8cBKJXEWW9IOAEliQhSaZxcR8YpjYMR9q9EoMNC56XRHVfzF4eLdv1FlADrrh47PDuA';
// const privateVapidKey = '7wLdTeWRw2kK1tiQgm45GcM8NcJBgJ-Cdj8iYJaKWXU';
const path = require('path')


app.use(express.static(path.join(__dirname,"client")))


app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Route handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


// Welcome message route
// app.get("/", (req, res) => {
//     res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
// });

const isAdmin = (req, res, next) => {
    const userId = req.user.id;
    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0 && results[0].role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied' });
        }
    });
};

app.post('/send-message',authenticateToken, isAdmin, (req, res) => {
    const { message } = req.body;
    const adminId = req.user.id;

    db.query('INSERT INTO messages (admin_id, message) VALUES (?, ?)', [adminId, message], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Retrieve all user tokens
        db.query('SELECT token FROM users WHERE token IS NOT NULL', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            const tokens = results.map(row => row.token);
            sendNotification(tokens, message);

            res.status(200).json({ message: 'Message sent' });
        });
    });
});

const sendNotification = (tokens, message) => {
    // Implementation for sending push notifications (e.g., using Firebase Cloud Messaging)
};

app.post('/save-device-token', authenticateToken, (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;

    db.query('UPDATE users SET token = ? WHERE id = ?', [token, userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Token saved' });
    });
});







// Report an image
app.get('/api/reports', (req, res) => {
    const query = 'SELECT * FROM reports'; // Adjust query as needed
    db.query(query, (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query failed' });
      }
      res.json(results);
    });
  });
  
 
  // Route to handle DELETE requests
app.delete('/api/reports/:id', (req, res) => {
    const reportId = req.params.id;

    const query = 'DELETE FROM reports WHERE id = ?';
    db.query(query, [reportId], (error, results) => {
        if (error) {
            console.error('Database query failed', error);
            return res.status(500).json({ error: 'Failed to delete report' });
        }

        if (results.affectedRows === 0) {
            // No report found with the given id
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json({ message: 'Report deleted successfully' });
    });
});
app.get('/api/reports/count', (req, res) => {
    const query = 'SELECT COUNT(*) AS count FROM reports'; // Adjust query as needed
    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json({ count: results[0].count });
    });
});


app.post('/api/auth/report/:id', authenticateToken, async (req, res) => {
    const imageId = req.params.id;
    const { reason } = req.body;

    // Validate input
    if (!imageId || !reason) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Handle the report
        await reportImage(imageId, reason);

        // Notify the admin
        await notifyAdmin(`A user has reported an image with ID: ${imageId}. Reason: ${reason}`);

        res.status(200).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Error reporting image:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/forms/:id/likes', authenticateToken, (req, res) => {
    const formId = parseInt(req.params.id);
    const userId = req.user.id;

    pool.query('SELECT * FROM likes WHERE user_id = ? AND image_id = ?', [userId, formId], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Error querying database' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Already liked' });
        }

        // Add the like
        pool.query('INSERT INTO likes (user_id, image_id) VALUES (?, ?)', [userId, formId], (error) => {
            if (error) {
                console.error('Error inserting like:', error);
                return res.status(500).json({ error: 'Error liking image' });
            }

            // Update the like count in forms table
            pool.query('UPDATE forms SET like_count = like_count + 1 WHERE id = ?', [formId], (error) => {
                if (error) {
                    console.error('Error updating like count:', error);
                    return res.status(500).json({ error: 'Error updating like count' });
                }

                res.status(200).json({ message: 'Image liked successfully' });
            });
        });
    });
});



app.post('/api/forms/:id/unlikes', authenticateToken, (req, res) => {
    const formId = parseInt(req.params.id);
    const userId = req.user.id; // User ID from authentication middleware

    if (!userId) {
        return res.status(400).json({ error: 'User ID is missing' });
    }

    // Check if the like exists
    db.query('SELECT * FROM likes WHERE user_id = ? AND image_id = ?', [userId, formId], (error, results) => {
        if (error) {
            console.error('Error checking like:', error);
            return res.status(500).json({ error: 'Error checking like' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Not liked yet' });
        }

        // Remove the like
        db.query('DELETE FROM likes WHERE user_id = ? AND image_id = ?', [userId, formId], (error) => {
            if (error) {
                console.error('Error removing like:', error);
                return res.status(500).json({ error: 'Error removing like' });
            }

            // Update the like count in forms table
            db.query('UPDATE forms SET like_count = like_count - 1 WHERE id = ?', [formId], (error) => {
                if (error) {
                    console.error('Error updating like count:', error);
                    return res.status(500).json({ error: 'Error updating like count' });
                }

                res.status(200).json({ message: 'Image unliked successfully' });
            });
        });
    });
});



app.get('/api/forms/:id/like-count', (req, res) => {
    const formId = parseInt(req.params.id);

    if (isNaN(formId)) {
        return res.status(400).json({ error: 'Invalid form ID' });
    }

    db.query('SELECT like_count FROM forms WHERE id = ?', [formId], (error, results) => {
        if (error) {
            console.error('Error fetching like count:', error);
            return res.status(500).json({ error: 'Error fetching like count' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        res.status(200).json({ like_count: results[0].like_count });
    });
});

app.get('/api/users/:id/liked-images', (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    db.query('SELECT image_id FROM likes WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Error fetching liked images:', error);
            return res.status(500).json({ error: 'Error fetching liked images' });
        }

        const likedImages = results.map(row => row.image_id);
        res.status(200).json({ liked_images: likedImages });
    });
});

// Fetch like count for a specific form
// app.get('/api/forms/:id/like-count', (req, res) => {
//     const { id } = req.params;
//     db.query('SELECT like_count FROM forms WHERE id = ?', [id], (err, results) => {
//         if (err) {
//             console.error('Database query error:', err);
//             return res.status(500).json({ error: 'Database query error' });
//         }
//         if (results.length === 0) {
//             return res.status(404).json({ error: 'Form not found' });
//         }
//         res.json({ like_count: results[0].like_count });
//     });
// });

// Like a form
// app.post('/api/forms/:id/likess', (req, res) => {
//     const { id } = req.params;
//     db.query('UPDATE forms SET like_count = like_count + 1 WHERE id = ?', [id], (err) => {
//         if (err) {
//             return res.status(500).json({ error: 'Database query error' });
//         }
//         res.status(200).json({ message: 'Form liked' });
//     });
// });

// Unlike a form
// app.post('/api/forms/:id/unlikes', (req, res) => {
//     const { id } = req.params;
//     db.query('UPDATE forms SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id], (err) => {
//         if (err) {
//             return res.status(500).json({ error: 'Database query error' });
//         }
//         res.status(200).json({ message: 'Form unliked' });
//     });
// });

// const PORT = 3001;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

// module.exports = app;

// const express = require('express');
// const bodyParser = require('body-parser');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const db = require('./config/db');
// const app = express();
// const cors = require('cors');
// app.use(cors());
// app.use(bodyParser.json());

// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// app.get("/", (req, res) => {
//     res.send("Hello! My name is PHENG SOPHORS, Thank You for using my API services. For any problems, contact me via email: sophorspheng.num@gmail.com");
// });
// ///like
// // Fetch the like count for a specific form
// // app.get('/api/forms/:id/like-count', (req, res) => {
// //   const { id } = req.params;
// //   db.query('SELECT like_count FROM forms WHERE id = ?', [id], (err, results) => {
// //     if (err) {
// //       return res.status(500).json({ error: 'Database query error' });
// //     }
// //     if (results.length === 0) {
// //       return res.status(404).json({ error: 'Form not found' });
// //     }
// //     res.json({ like_count: results[0].like_count });
// //   });
// // });
// app.get('/api/forms/:id/like-count', (req, res) => {
//   const { id } = req.params;
//   db.query('SELECT like_count FROM forms WHERE id = ?', [id], (err, results) => {
//       if (err) {
//           console.error('Database query error:', err);
//           return res.status(500).json({ error: 'Database query error' });
//       }
//       if (results.length === 0) {
//           return res.status(404).json({ error: 'Form not found' });
//       }
//       res.json({ like_count: results[0].like_count });
//   });
// });


// // // Like a form
// app.post('/api/forms/:id/likes', (req, res) => {
//   const { id } = req.params;
//   db.query('UPDATE forms SET like_count = like_count + 1 WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     res.status(200).json({ message: 'Form liked' });
//   });
// });

// // // Unlike a form
// app.post('/api/forms/:id/unlikes', (req, res) => {
//   const { id } = req.params;
//   db.query('UPDATE forms SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     res.status(200).json({ message: 'Form unliked' });
//   });
// });





// ///like
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = app;
