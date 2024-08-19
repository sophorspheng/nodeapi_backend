const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });
const bcrypt = require("bcryptjs");
const crypto = require('crypto')
const nodemailer = require('nodemailer');
const cloudinary = require("../middleware/cloudinary");
const transporter = require("../middleware/transporter");
const mysql = require("mysql2");

const sendVerificationEmail = (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or any other email service
    auth: {
      user: 'sophorspheng.num@gmail.com',
      pass: 'uhrv bmpv jmkj jfxn'
    }
  });

  const mailOptions = {
    from: 'sophorspheng.num@gmail.com',
    to: email,
    subject: 'Verify Your Email',
    text: `Please verify your email by using the following code: ${verificationCode}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending verification email:", error);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
};
///create new users or admin accounts

// exports.register = (req, res) => {
//   const { password } = req.body;

//     // Validate password length
//     if (password.length < 8) {
//         return res.status(400).json({ message: "Password must be at least 8 characters long." });
//     }
//   const newUser = req.body;
//   newUser.role = req.body.role || "user"; // Default role is 'user' if not provided

//   User.createUser(newUser, (err, result) => {
//     if (err) {
//       res.status(500).send({ message: "Error registering user" });
//     } else {
//       res.status(201).send({ message: "User registered successfully" });
//     }
//   });
// };
const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit number as a string
};

exports.register = (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate password length
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }

  // Generate a 4-digit verification code
  const verificationCode = generateVerificationCode();

  // Get the current timestamp
  const registrationTime = new Date();

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: "Error hashing password." });
    }

    // Insert user into MySQL database
    const query =
      "INSERT INTO users (name, email, password, role, verification_code, is_verified, registration_time) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(
      query,
      [name, email, hashedPassword, role || "user", verificationCode, false, registrationTime],
      (err, results) => {
        if (err) {
          console.error("Error registering user:", err);
          return res.status(500).json({ message: "Account has been registed already." });
        }

        // Send the 4-digit verification code to the user
        sendVerificationEmail(email, verificationCode);

        res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
      }
    );
  });
};

const checkUnverifiedAccounts = () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const query = "DELETE FROM users WHERE is_verified = false AND registration_time < ?";
  
  db.query(query, [tenMinutesAgo], (err, results) => {
    if (err) {
      console.error("Error deleting unverified accounts:", err);
    } else {
      console.log(`Deleted ${results.affectedRows} unverified accounts.`);
    }
  });
};

// Check every minute
setInterval(checkUnverifiedAccounts, 60 * 1000);



exports.verifyAccount = (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(400).json({ message: "Email and verification code are required." });
  }

  const query = "SELECT * FROM users WHERE email = ? AND verification_code = ? AND is_verified = false";

  db.query(query, [email, verificationCode], (err, results) => {
    if (err) {
      console.error("Error verifying account:", err);
      return res.status(500).json({ message: "Error verifying account." });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const updateQuery = "UPDATE users SET is_verified = true, verification_code = NULL WHERE email = ?";

    db.query(updateQuery, [email], (err, updateResults) => {
      if (err) {
        console.error("Error updating user verification status:", err);
        return res.status(500).json({ message: "Error updating user verification status." });
      }

      res.status(200).json({ message: "Account verified successfully. You can now log in." });
    });
  });
};



// exports.register = (req, res) => {
//   const { name, email, password, role } = req.body;

//   // Validate password length
//   if (password.length < 8) {
//     return res
//       .status(400)
//       .json({ message: "Password must be at least 8 characters long." });
//   }

//   // Hash the password
//   bcrypt.hash(password, 10, (err, hashedPassword) => {
//     if (err) {
//       return res.status(500).json({ message: "Error hashing password." });
//     }

//     // Insert user into MySQL database
//     const query =
//       "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

//     db.query(
//       query,
//       [name, email, hashedPassword, role || "user"],
//       (err, results) => {
//         if (err) {
//           console.error("Error registering user:", err);
//           return res.status(500).json({ message: "Error registering user." });
//         } else {
//           res.status(201).json({ message: "User registered successfully." });
//         }
//       }
//     );
//   });
// };

///sigin users or admin accounts
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  // Query the database to find the user by email
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    // Check if the email exists in the database
    if (results.length === 0) {
      return res.status(401).json({ message: "Email does not exist." });
    }

    const user = results[0];

    // Check if the user is verified
    if (!user.is_verified) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // If the account was created more than 10 minutes ago and is not verified, delete it
      if (new Date(user.registration_time) < tenMinutesAgo) {
        const deleteQuery = "DELETE FROM users WHERE email = ?";
        db.query(deleteQuery, [email], (err, deleteResult) => {
          if (err) {
            console.error("Error deleting unverified account:", err);
            return res.status(500).json({ message: "Internal server error." });
          }

          return res.status(401).json({ message: "Verification time expired. Please register again." });
        });
      } else {
        return res.status(403).json({ message: "Please verify your email before logging in." });
      }
    } else {
      // Compare the provided password with the hashed password in the database
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error("Bcrypt error:", err);
          return res.status(500).json({ message: "Internal server error." });
        }

        // If the password does not match
        if (!match) {
          return res.status(401).json({ message: "Incorrect password." });
        }

        // Generate a JWT token upon successful login
        const token = jwt.sign(
          { id: user.id, name: user.email, role: user.role },
          "JLAJO12@#)@*(#jsljdalsj121923#*@@*#3uj293",
          { expiresIn: "1h" }
        );

        // Send the token, user role, and user ID in the response
        res.json({ token, role: user.role, id: user.id });
        console.log("User ID:", user.id);
      });
    }
  });
};



// exports.login = (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) return res.sendStatus(400);

//   db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
//     if (err) return res.sendStatus(500);
//     if (results.length === 0) return res.sendStatus(401);

//     const user = results[0];
//     bcrypt.compare(password, user.password, (err, match) => {
//       if (err) return res.sendStatus(500);
//       if (!match) return res.sendStatus(401);

//       //   const token = jwt.sign({ username: user.email, role: user.role }, db.jwtSecret, { expiresIn: '1h' });
//       const token = jwt.sign(
//         { name: user.email, role: user.role },
//         "JLAJO12@#)@*(#jsljdalsj121923#*@@*#3uj293", // Replace with a valid secret key
//         { expiresIn: "1h" }
//       );
//       res.json({ token, role: user.role });
//     });
//   });
// };

//forgotten password users and admin can be reset

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findByEmail(email, (err, results) => {
    if (err || results.length === 0) {
      res.status(404).send({ message: "User not found" });
    } else {
      const user = results[0];
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Send OTP via email
      const mailOptions = {
        from: "sophorspheng.num@gmail.com",
        to: user.email,
        subject: "OTP reset password",
        text: `Thank You for using PurestWallpaper, Your OTP code is ${otp}`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          res.status(500).send({ message: "Error sending OTP" });
        } else {
          // Save OTP to database or cache (for simplicity, we're saving it in the user record)
          User.updateUser(user.id, { otp }, (err, result) => {
            if (err) {
              res.status(500).send({ message: "Error saving OTP" });
            } else {
              res.status(200).send({ message: "OTP sent successfully" });
            }
          });
        }
      });
    }
  });
};

///reset password users account renew password suddenly

exports.resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  User.findByEmail(email, (err, results) => {
    if (err || results.length === 0) {
      res.status(404).send({ message: "User not found" });
    } else {
      const user = results[0];

      if (user.otp === otp) {
        bcrypt.hash(newPassword, 10, (err, hash) => {
          if (err) throw err;
          User.updateUser(
            user.id,
            { password: hash, otp: null },
            (err, result) => {
              if (err) {
                res.status(500).send({ message: "Error resetting password" });
              } else {
                res
                  .status(200)
                  .send({ message: "Password reset successfully" });
              }
            }
          );
        });
      } else {
        res.status(400).send({ message: "Invalid OTP" });
      }
    }
  });
};

///Display and Calling Data

exports.getData = (req, res) => {
  const query = "SELECT id, name, image_path FROM forms";
  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Database query error" });
    }

    const data = results.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image_path, // Already a full URL
    }));

    res.json(data);
  });
};

///Remove one data record

exports.deleteImage = (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);

  const { id } = req.params;
  const selectQuery = "SELECT image_path FROM forms WHERE id = ?";

  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Server error");
    }

    if (results.length === 0) {
      return res.status(404).send("Record not found");
    }

    const imageUrl = results[0].image_path;

    // Extract the public ID including the folder structure
    const imagePathParts = imageUrl.split("/upload/");
    const publicId = imagePathParts[1].split(".")[0];
    // Extract the public_id without the extension

    // Delete the image from Cloudinary
    cloudinary.uploader.destroy(publicId, (error) => {
      if (error) {
        console.error("Cloudinary deletion error:", error);
        return res.status(500).send("Failed to delete image from Cloudinary");
      }

      // Delete the record from the database
      const deleteQuery = "DELETE FROM forms WHERE id = ?";

      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error("Database deletion error:", err);
          return res.status(500).send("Server error");
        }

        if (result.affectedRows === 0) {
          return res.status(404).send("Record not found");
        }

        res.send("Record and image deleted successfully");
      });
    });
  });
};

///upload data to the server

exports.uploadData = (req, res) => {
  const { name } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    console.error("No files uploaded");
    return res.status(400).json({ error: "No files uploaded" });
  }

  console.log(
    "Files received for upload:",
    files.map((file) => file.originalname)
  ); // Debug log

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: "image",
        resource_type: "image",
        public_id: file.originalname.split(".")[0], // Use the file name without extension
      };

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url); // Cloudinary URL of the uploaded image
          }
        })
        .end(file.buffer); // End the stream with the file buffer
    });
  });

  Promise.all(uploadPromises)
    .then((imageUrls) => {
      const query = "INSERT INTO forms (name, image_path) VALUES ?";
      const values = imageUrls.map((imageUrl) => [name, imageUrl]);

      db.query(query, [values], (error, results) => {
        if (error) {
          console.error("Database query error:", error);
          return res.status(500).json({ error: "Database query error" });
        }

        console.log("Image data inserted into database:", results); // Debug log

        res.json({ id: results.insertId, name, images: imageUrls });
      });
    })
    .catch((error) => {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "Error uploading images" });
    });
};

/*....................................Thank You!............................*/
