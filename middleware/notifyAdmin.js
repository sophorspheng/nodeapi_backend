const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service provider
    auth: {
        user: 'sophorspheng.num@gmail.com',
        pass: 'uhrv bmpv jmkj jfxn'
    }
});

async function notifyAdmin(message) {
    const mailOptions = {
        from: 'sophorspheng.num@gmail.com',
        to: 'sophorspheng.num@gmail.com',
        subject: 'Image Report Notification',
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Notification sent to admin.');
    } catch (error) {
        console.error('Error sending notification to admin:', error);
    }
}

module.exports = notifyAdmin;
