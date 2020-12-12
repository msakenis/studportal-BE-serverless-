const mysql = require('mysql');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};
const database = (callback) => {
  const dbConnection = mysql.createConnection(config);

  dbConnection.connect((err) => {
    if (err) throw err;
    callback(dbConnection);
    console.log('Successfully connected to DB');
  });
};
module.exports = database;
