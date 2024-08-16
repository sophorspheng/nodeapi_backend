const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK with the JSON file
const serviceAccount = require('./mobileapp-76bf0-firebase-adminsdk-djh1m-6faea1d649.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to send a notification
const sendNotification = (registrationToken, message) => {
  const payload = {
    notification: {
      title: 'Notification Title',
      body: message,
    },
  };

  admin.messaging().sendToDevice(registrationToken, payload)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
};

module.exports = { sendNotification };
