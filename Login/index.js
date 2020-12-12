const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../SharedCode/db');
const { sendContext } = require('../SharedCode/sendContext');
const { validateLogin } = require('../SharedCode/middleware');

module.exports = function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  if (req.method === 'POST') {
    if (validateLogin(req)) {
      //validation function imported from middleware.js returns true or false
      const email = req.body.email;
      database((db) =>
        db.query(
          `SELECT * from users WHERE email = ${mysql.escape(email)}`,
          (err, result) => {
            if (err) {
              sendContext(context, err, 400); //sendContext function imported from sendContext.js sends context by json as response
            } else {
              if (result.length !== 0) {
                bcrypt.compare(
                  // bcrypt additional npm module to compare decrypt and compare password with given
                  req.body.password,
                  result[0].password,
                  (bErr, bResult) => {
                    if (bErr || !bResult) {
                      sendContext(
                        context,
                        {
                          msg: 'Email or password is incorrect',
                        },
                        400
                      );
                    } else {
                      if (bResult) {
                        const token = jwt.sign(
                          {
                            userId: result[0].id,
                            email: result[0].email,
                          },
                          process.env.SECRETKEY,
                          {
                            expiresIn: '7d',
                          }
                        );
                        db.query(
                          `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'` // updates last login date in DB
                        );
                        sendContext(context, { msg: 'Logged In', token }, 200);
                      }
                    }
                  }
                );
              } else {
                sendContext(
                  context,
                  { msg: 'Email or password is incorrect' },
                  401
                );
              }
            }
          }
        )
      );
    } else {
      sendContext(context, { msg: 'Please enter email and password!' }, 400);
    }
  }
};
