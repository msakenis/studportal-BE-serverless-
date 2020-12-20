const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = function (context, req) {
  try {
       // checks if logged in
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);

    if (req.body.id) {
      database((db) => {
        db.query(
          `DELETE FROM courses WHERE id = ${mysql.escape(req.body.id)}`,
          (err, result) => {
            if (err) {
              sendContext(context, err, 400);
            } else {
              // students table course_id needs to be set to 0 that students could be attached to another course
              db.query(
                `UPDATE students SET course_id = '0' WHERE course_id = ${mysql.escape(
                  req.body.id
                )}`,
                (err, result) => {
                  if (err) {
                    sendContext(context, err, 400);
                  } else {
                    sendContext(context, { msg: 'Deleted!' }, 200);
                  }
                }
              );
            }
          }
        );
      });
    } else {
      sendContext(context, { msg: 'Error in request body!' }, 400);
    }
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }
};
