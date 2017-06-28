const jwt = require("jsonwebtoken");

const secret = require('./../misc/secrets');
const { ID_INVALID_OR_NOT_PRESENT } = require('./../misc/errors');

const authMiddleWare = (request, response, next) => {
  let token = request.header("x-auth");
  jwt.verify(token, secret, (error, loggedInUser) => {
    if (error)
      return response
        .status(401)
        .send({
          message: ID_INVALID_OR_NOT_PRESENT
        });
    request.loggedInUser = loggedInUser;
    next();
  });
};

module.exports = { authMiddleWare };
