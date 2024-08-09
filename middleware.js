const jwt = require('jsonwebtoken');

function authorizeRoles(...roles) {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1]; // Get token from "Bearer <token>"

        if (!token) {
            console.log('No token provided');
            return res.status(403).send('A token is required for authentication');
        }

        try {
            const decoded = jwt.verify(token, 'your_jwt_secret'); // Ensure this matches the secret used for signing
            req.user = decoded;

            console.log('Decoded token:', decoded); // Debug log

            if (!roles.includes(req.user.role)) {
                console.log('Access denied: User does not have required role');
                return res.status(403).send('Access denied');
            }

            next();
        } catch (err) {
            console.error('Token validation error:', err);
            return res.status(401).send('Invalid token');
        }
    };
}

module.exports = authorizeRoles;
