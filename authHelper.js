const jwt = require('jsonwebtoken');

function generateToken(user) {
    const token = jwt.sign({ userId: user.id, role: user.role }, 'YOUR_SECRET_KEY', { expiresIn: '1h' });
    return token;
}

module.exports = { generateToken };
