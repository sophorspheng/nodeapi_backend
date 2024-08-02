const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'bly8lzj6xutf9s2k61rc-mysql.services.clever-cloud.com',
    user: 'uh2hxkyn6dvplh0q',
    password: '89ZhwLv0lOFI50utVfUU',
    database: 'bly8lzj6xutf9s2k61rc',
    port: 3306
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

module.exports = db;
