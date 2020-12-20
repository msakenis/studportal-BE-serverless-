const jwt = require('jsonwebtoken');
const { sendContext } = require('../SharedCode/sendContext');
const database = require('../SharedCode/db');

module.exports = function (context, req) {
  // checks if logged in
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);
    req.userData = decodedToken;
    database((db) =>
      db.query(
        `SELECT a.*, b.title FROM students a LEFT JOIN courses b on a.course_id = b.id`, // join course title to students which they belong to
        (err, result) => {
          if (err) {
            sendContext(context, err, 400);
          } else {
            sendContext(context, result, 200);
          }
        }
      )
    );
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }
};
