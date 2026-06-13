const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "mysql_root",
    database: process.env.DB_NAME || "books_db"
})


connection.connect((err) => {
    if (err) {
        throw err;
    }

    console.log("Connected to MySQL")
});

module.exports = connection;