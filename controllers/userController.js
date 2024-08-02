const User = require('../models/userModel');

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
