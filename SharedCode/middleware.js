function validateLogin(req) {
  return req.body.email && req.body.password;
}

exports.validateLogin = validateLogin;
