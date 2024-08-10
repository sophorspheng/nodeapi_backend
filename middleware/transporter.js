const nodemailer = require("nodemailer");

// Create transporter for sending emails

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sophorspheng.num@gmail.com",
    pass: "uhrv bmpv jmkj jfxn",
  },
});

module.exports = transporter;