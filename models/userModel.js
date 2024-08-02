const db = require('../config/db');
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = {
    createUser: (userData, callback) => {
        bcrypt.hash(userData.password, 10, (err, hash) => {
            if (err) throw err;
            userData.password = hash;
            db.query('INSERT INTO users SET ?', userData, callback);
        });
    },

    findByEmail: (email, callback) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], callback);
    },

    getUserById: (id, callback) => {
        db.query('SELECT * FROM users WHERE id = ?', [id], callback);
    },

    getAllUsers: (callback) => {
        db.query('SELECT * FROM users', callback);
    },

    updateUser: (id, userData, callback) => {
        db.query('UPDATE users SET ? WHERE id = ?', [userData, id], callback);
    },

    deleteUser: (id, callback) => {
        db.query('DELETE FROM users WHERE id = ?', [id], callback);
    }
};

module.exports = User;
