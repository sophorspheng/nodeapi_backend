const jwt = require('jsonwebtoken');

function authorizeRoles(...roles) {
    return (req, res, next) => {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).send('A token is required for authentication');
        }

        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            req.user = decoded;

            if (!roles.includes(req.user.role)) {
                return res.status(403).send('Access denied');
            }

            next();
        } catch (err) {
            return res.status(401).send('Invalid token');
        }
    };
}

module.exports = authorizeRoles;
