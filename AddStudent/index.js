const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = function (context, req) {
  try {
     // checks if logged in
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);

    if (validateAddStudent(req)) {
      database((db) => {
        db.query(
          `INSERT INTO students (name, surname, phone, email, last_modified, studing, course_id) VALUES (${mysql.escape(
            req.body.name
          )}, ${mysql.escape(req.body.surname)}, ${mysql.escape(
            req.body.phone
          )}, ${mysql.escape(req.body.email)}, now(), ${mysql.escape(
            req.body.studing
          )}, '0')`,
          (err, result) => {
            if (err) {
              sendContext(context, err, 400);
            } else {
              sendContext(
                context,
                { msg: 'Successfully added the student to the database!' },
                201
              );
            }
          }
        );
      });
    }
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }

  function validateAddStudent(req) {
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
