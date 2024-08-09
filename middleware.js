const jwt = require('jsonwebtoken');

function authorizeRoles(...roles) {
    return (req, res, next) => {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).send('A token is required for authentication');
        }

        try {
            const decoded = jwt.verify(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE3MjMyMTkyMjQsImV4cCI6MTcyMzIyMjgyNH0.RNt37iaXhVTP2Tp0LjFVFiXO54Ak5bXTm9oaxgWOhCE');
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
