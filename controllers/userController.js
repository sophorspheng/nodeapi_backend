const User = require('../models/userModel');
const db = require('../config/db');
exports.getAllUsers = (req, res) => {
    User.getAllUsers((err, results) => {
        if (err) {
            res.status(500).send({ message: 'Error fetching users' });
        } else {
            res.status(200).send(results);
        }
    });
};

exports.getUserById = (req, res) => {
    const userId = req.params.id;

    User.getUserById(userId, (err, result) => {
        if (err || result.length === 0) {
            res.status(404).send({ message: 'User not found' });
        } else {
            res.status(200).send(result[0]);
        }
    });
};

exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const updatedData = req.body;

    User.updateUser(userId, updatedData, (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Error updating user' });
        } else {
            res.status(200).send({ message: 'User updated successfully' });
        }
    });
};

exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    User.deleteUser(userId, (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Error deleting user' });
        } else {
            res.status(200).send({ message: 'User deleted successfully' });
        }
    });
};

exports.reportImage = (req,res)=>{
    try {
        const { imageId, reportText } = req.body;

        if (!imageId || !reportText) {
            return res.status(400).json({ error: 'Image ID and report text are required' });
        }

        const query = 'INSERT INTO reports (image_id, report_text) VALUES (?, ?)';
        db.query(query, [imageId, reportText], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Database query error', details: err.message });
            }

            res.status(201).json({ message: 'Image reported successfully' });
        });
    } catch (err) {
        console.error('Unexpected server error:', err);
        res.status(500).json({ error: 'Unexpected server error', details: err.message });
    }

}
