const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const db = require('../config/db');


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
    // const newUser = req.body;

    // User.createUser(newUser, (err, result) => {
    //     if (err) {
    //         res.status(500).send({ message: 'Error registering user' });
    //     } else {
    //         res.status(201).send({ message: 'User registered successfully' });
    //     }
    // });
    const newUser = req.body;
    newUser.role = req.body.role || 'user'; // Default role is 'user' if not provided

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
  if (!email || !password) return res.sendStatus(400);

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.sendStatus(500);
    if (results.length === 0) return res.sendStatus(401);

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.sendStatus(500);
      if (!match) return res.sendStatus(401);

    //   const token = jwt.sign({ username: user.email, role: user.role }, db.jwtSecret, { expiresIn: '1h' });
    const token = jwt.sign(
        { name: user.email, role: user.role },
        'JLAJO12@#)@*(#jsljdalsj121923#*@@*#3uj293', // Replace with a valid secret key
        { expiresIn: '1h' }
      );
      res.json({ token, role: user.role});
    });
  });
    // const { email, password } = req.body;

    // User.findByEmail(email, (err, results) => {
    //     if (err || results.length === 0) {
    //         res.status(401).send({ message: 'Authentication failed. User not found.' });
    //     } else {
    //         const user = results[0];
    //         bcrypt.compare(password, user.password, (err, isMatch) => {
    //             if (isMatch && !err) {
    //                 const token = jwt.sign({ id: user.id }, 'your_jwt_secret', {
    //                     expiresIn: '1h'
    //                 });
    //                 res.status(200).send({ token });
    //             } else {
    //                 res.status(401).send({ message: 'Authentication failed. Wrong password.' });
    //             }
    //         });
    //     }
    // });
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
                subject: 'OTP reset password',
                text: `Thank You for using PurestWallpaper, Your OTP code is ${otp}`
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
