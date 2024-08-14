const db = require('../config/db'); // Adjust the path if necessary

async function reportImage(imageId, reason) {
    await db.query(
        'INSERT INTO reports (image_id, reason, reported_at) VALUES (?, ?, NOW())',
        [imageId, reason]
    );
}

module.exports = reportImage;
