const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });
const bcrypt = require("bcryptjs");
const cloudinary = require("../middleware/cloudinary");
const transporter = require('../middleware/transporter')




///create new users or admin accounts

exports.register = (req, res) => {
  const newUser = req.body;
  newUser.role = req.body.role || "user"; // Default role is 'user' if not provided

  User.createUser(newUser, (err, result) => {
    if (err) {
      res.status(500).send({ message: "Error registering user" });
    } else {
      res.status(201).send({ message: "User registered successfully" });
    }
  });
};





///sigin users or admin accounts

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.sendStatus(400);

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.sendStatus(500);
    if (results.length === 0) return res.sendStatus(401);

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.sendStatus(500);
      if (!match) return res.sendStatus(401);

      //   const token = jwt.sign({ username: user.email, role: user.role }, db.jwtSecret, { expiresIn: '1h' });
      const token = jwt.sign(
        { name: user.email, role: user.role },
        "JLAJO12@#)@*(#jsljdalsj121923#*@@*#3uj293", // Replace with a valid secret key
        { expiresIn: "1h" }
      );
      res.json({ token, role: user.role });
    });
  });
};



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