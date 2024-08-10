const jwt = require('jsonwebtoken');
const jwtSecret = 'JLAJO12@#)@*(#jsljdalsj121923#*@@*#3uj293'
// Middleware to authenticate JWT and check role
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
module.exports = authenticateJWT;