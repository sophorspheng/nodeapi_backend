const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateJWT = require('../middleware/authenticateJWT')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/data',authenticateJWT, authController.getData);
router.delete('/delete/:id',authenticateJWT, authController.deleteImage);
router.post('/upload',authenticateJWT,upload.array('images', 10),authController.uploadData)

module.exports = router;
