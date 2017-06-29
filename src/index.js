const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const cors = require("cors");
const hash = require('password-hash');

const { mongoose } = require("./db/mongooseConfig");
const { modelRoutes } = require("./../src/routes/routes");
const {
  Equity,
  User,
  Transaction,
  Account,
  Grouping,
  Budget
} = require("./db/models");
const secret = require("./misc/secrets");
const { ID_INVALID_OR_NOT_PRESENT } = require("./misc/errors");

const BASE_URL = "/api/";
const corsConfig = {
  origin: "http://localhost:3000",
  allowedHeaders: [
    "Accept-Version",
    "Authorization",
    "Credentials",
    "Content-Type",
    "x-auth"
  ],
  exposedHeaders: ["X-Request-Id", "x-auth"]
};

var app = express();

app.use(bodyParser.json());

app.use(cors(corsConfig));

app.get("/api/whoAmI", (request, response) => {
  let token = request.header("x-auth");
  jwt.verify(token, secret, (error, loggedInUser) => {
    if (error) {
      return response.status(401).send({
        error: ID_INVALID_OR_NOT_PRESENT
      });
    }
    return response.status(200).send(loggedInUser);
  });
});

app.post("/api/signUp", (request, response) => {
  let { name, email, password } = request.body;

  const cryptedPassword = hash.generate(password, {algorithm:'sha256',saltLength: 8,iterations: 4});

  let user = new User({
    name,
    email,
    password: cryptedPassword
  });

  user
    .save()
    .then(user => {
      let userToSend = _.pick(user, ["_id", "name", "email"]);
      let token = jwt.sign(userToSend, secret);
      response
        .set("Access-Control-Expose-Headers")
        .set("x-auth", token)
        .status(201)
        .send(userToSend);
    })
    .catch(error =>
      response.status(409).send({ message: "Wrong input was provided!" })
    );
});

app.post("/api/logIn", (request, response) => {
  if (!request.body.email || !request.body.password)
    return response
      .status(400)
      .send({ message: "Email and password must be present in the request!" });
  let { email, password } = request.body;
  User.findOne({ email })
    .then(user => {
      if (hash.verify(password, user.password)) {
        let userToSend = _.pick(user, ["_id", "name", "email"]);
        let token = jwt.sign(userToSend, secret);
        return response.set("x-auth", token).status(200).send(userToSend);
      }

      return response.status(401).send({ message: "Wrong password provided!" });
    })
    .catch(error => response.status(404).send({ message: error }));
});

app.use(`${BASE_URL}`, modelRoutes);

app.listen(2000, () => {
  console.log("Server running on port: " + 2000);
});

module.exports = { app };
