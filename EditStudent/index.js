const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = function (context, req) {
  const id = context.bindingData.id; // gets id from route params

  try {
    // checks if logged in
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);

    if (req.method === 'POST') {
      if (validateEditStudent(req)) {
        database((db) => {
          db.query(
            `UPDATE students SET name = ${mysql.escape(
              req.body.name
            )}, surname = ${mysql.escape(
              req.body.surname
            )}, phone = ${mysql.escape(req.body.phone)}, email = ${mysql.escape(
              req.body.email
            )}, last_modified = now(), studing = ${mysql.escape(
              req.body.studing
            )} WHERE id = ${mysql.escape(id)}`,
            (err, result) => {
              if (err) {
                sendContext(context, err, 400);
              } else {
                sendContext(context, { msg: 'Successfully changed!' }, 201);
              }
            }
          );
        });
      }
    } else {
      database((db) =>
        db.query(
          `SELECT * FROM students WHERE id = ${mysql.escape(id)}`,
          (err, result) => {
            if (err) {
              sendContext(context, err, 400);
            } else {
              if (result.length !== 0) {
                sendContext(context, result, 200);
              } else {
                sendContext(context, { msg: 'User Not Found!' }, 400);
              }
            }
          }
        )
      );
    }
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }

  function validateEditStudent(req) {
    if (
      req.body.name.length < 50 &&
      req.body.name.length > 2 &&
      req.body.surname.length < 50 &&
      req.body.surname.length > 2 &&
      req.body.phone.length < 15 &&
      req.body.phone.length > 5 &&
      req.body.email.length < 50 &&
      req.body.email.length > 2
    ) {
      return true;
    } else {
      sendContext(context, { msg: 'Error in filling the form!' }, 400);
      return false;
    }
  }
};
