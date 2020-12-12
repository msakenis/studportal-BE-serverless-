const jwt = require('jsonwebtoken');
const { sendContext } = require('../SharedCode/sendContext');

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRETKEY);
    req.userData = decodedToken;
    sendContext(context, { msg: 'ok' }, 200);
  } catch (err) {
    sendContext(context, { msg: 'Please login to process this action!' }, 401);
  }
};
