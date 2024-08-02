const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');


const nodemailer = require('nodemailer');

// Create transporter for sending emails


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sophorspheng.num@gmail.com',
      pass: 'uhrv bmpv jmkj jfxn'
    }
});


exports.register = (req, res) => {
    const newUser = req.body;

    User.createUser(newUser, (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Error registering user' });
        } else {
            res.status(201).send({ message: 'User registered successfully' });
        }
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, results) => {
        if (err || results.length === 0) {
            res.status(401).send({ message: 'Authentication failed. User not found.' });
        } else {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (isMatch && !err) {
                    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', {
                        expiresIn: '1h'
                    });
                    res.status(200).send({ token });
                } else {
                    res.status(401).send({ message: 'Authentication failed. Wrong password.' });
                }
            });
        }
    });
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findByEmail(email, (err, results) => {
        if (err || results.length === 0) {
            res.status(404).send({ message: 'User not found' });
        } else {
            const user = results[0];
            const otp = Math.floor(100000 + Math.random() * 900000);

            // Send OTP via email
            const mailOptions = {
                from: 'sophorspheng.num@gmail.com',
                to: user.email,
                subject: 'Password Reset OTP',
                text: `Your OTP code is ${otp}`
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    res.status(500).send({ message: 'Error sending OTP' });
                } else {
                    // Save OTP to database or cache (for simplicity, we're saving it in the user record)
                    User.updateUser(user.id, { otp }, (err, result) => {
                        if (err) {
                            res.status(500).send({ message: 'Error saving OTP' });
                        } else {
                            res.status(200).send({ message: 'OTP sent successfully' });
                        }
                    });
                }
            });
        }
    });
};

exports.resetPassword = (req, res) => {
    const { email, otp, newPassword } = req.body;

    User.findByEmail(email, (err, results) => {
        if (err || results.length === 0) {
            res.status(404).send({ message: 'User not found' });
        } else {
            const user = results[0];

            if (user.otp === otp) {
                bcrypt.hash(newPassword, 10, (err, hash) => {
                    if (err) throw err;
                    User.updateUser(user.id, { password: hash, otp: null }, (err, result) => {
                        if (err) {
                            res.status(500).send({ message: 'Error resetting password' });
                        } else {
                            res.status(200).send({ message: 'Password reset successfully' });
                        }
                    });
                });
            } else {
                res.status(400).send({ message: 'Invalid OTP' });
            }
        }
    });
};
