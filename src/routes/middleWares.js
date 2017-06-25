const jwt = require("jsonwebtoken");

const secret = "secret";

const authMiddleWare = (request, response, next) => {
  let token = request.header("x-auth");
  jwt.verify(token, secret, (error, loggedInUser) => {
    if (error)
      return response
        .status(403)
        .send({
          message: "Authentication token is not present or is invalid!"
        });
    request.loggedInUser = loggedInUser;
    next();
  });
};

module.exports = { authMiddleWare };
