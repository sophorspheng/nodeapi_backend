const jwt = require('jsonwebtoken');

function authorizeRoles(...roles) {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            console.log('No token provided');
            return res.status(403).json({ error: 'A token is required for authentication' });
        }

        try {
            const decoded = jwt.verify(token, 'g56465ghfd5dctvs45ed5rd5###@@$%' || 'default_secret_key');
            req.user = decoded;

            if (!roles.includes(req.user.role)) {
                console.log('Access denied: User does not have required role');
                return res.status(403).json({ error: 'Access denied' });
            }

            next();
        } catch (err) {
            console.error('Token validation error:', err);
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
}

module.exports = authorizeRoles;
