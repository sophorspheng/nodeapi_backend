const mysql = require('mysql');
// const mysql = require('mysql2/promise');
const db = mysql.createPool({
  connectionLimit: 10,
  host: 'bly8lzj6xutf9s2k61rc-mysql.services.clever-cloud.com',
  user: 'uh2hxkyn6dvplh0q',
  password: '89ZhwLv0lOFI50utVfUU',
  database: 'bly8lzj6xutf9s2k61rc',
  port: 3306
});

// host: '897.h.filess.io',
// user: 'MobileECM_truthfully',
// password: '4f68677060f5d016ffc2162b8be0ab3bce885cb1',
// database: 'MobileECM_truthfully',
// port: 3307

/



// function getConnection(callback) {
//   db.getConnection((err, connection) => {
//     if (err) {
//       console.error('Error getting a connection from the pool:', err);
//       return callback(err);
//     }
//     callback(null, connection);
//   });
// }

// // Example query usage
// getConnection((err, connection) => {
//   if (err) throw err;

//   connection.query('SELECT 1 + 1 AS solution', (error, results) => {
//     connection.release(); // Release the connection back to the pool

//     if (error) throw error;
//     console.log('The solution is:', results[0].solution);
//   });
// });


// Export the pool
module.exports = db;
