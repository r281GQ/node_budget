const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const cors = require('cors');

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

const ACCOUNT_BASE_URL = "account";

const secret = "secret";

const BASE_URL = "/api/";

const corsConfig = {
  origin: 'http://localhost:3000',
  allowedHeaders: ['Accept-Version', 'Authorization', 'Credentials', 'Content-Type','x-auth'],
  exposedHeaders: ['X-Request-Id', 'x-auth'],
};
var app = express();

app.use(bodyParser.json());

app.use(cors(corsConfig));

app.get('/api/whoAmI'  ,(request, response) => {
  let token = request.header("x-auth");
  jwt.verify(token, secret, (error, loggedInUser) => {
    if (error){
      console.log(error);
      return response
        .status(403)
        .send({
          message: "Authentication token is not present or is invalid!"
        });
    }

    return response.status(200).send(loggedInUser);
  });
});

app.post("/api/signUp", (request, response) => {
  let { name, email, password } = request.body;

  let user = new User({
    name,
    email,
    password
  });

  user
    .save()
    .then(user => {
      let userToSend = _.pick(user, ["_id", "name", "email"]);

      let token = jwt.sign(userToSend, secret);

      response.set("Access-Control-Expose-Headers").set("x-auth", token).status(201).send(userToSend);
    })
    .catch(error => response.status(409).send({message: 'Wrong input was provided!'}));
});

app.post("/api/logIn", (request, response) => {
  // console.log('sdfs');
  if(!request.body.email || !request.body.password)
    return response.status(400).send({message: 'Email and password must be present in the request!'})
  let { email } = request.body;
  User.findOne({ email })
    .then(user => {
      let { password } = user;
      if (password === request.body.password) {
        let userToSend = _.pick(user, ["_id", "name", "email"]);
        let token = jwt.sign(userToSend, secret);
        return response.set("x-auth", token).status(200).send(userToSend);
      }

      return response.status(401).send({ message: "Wrong password provided!" });
    })
    .catch((error) => response.status(404).send({ message: error }));
});
// app.use(`${BASE_URL}${ACCOUNT_BASE_URL}`, routes);
app.use(`${BASE_URL}`, modelRoutes);

app.listen(2000, () => {
  console.log("Server running on port: " + 2000);
});
// app.put("/api/equities", authMiddleWare, (req, res) => {
//   let { _id, name, initialBalance } = req.body;
//   let userID = req.loggedInUser._id;
//
//   let eqBe;
//
//   Equity.findOneAndUpdate(
//     { _id },
//     { $set: { name, initialBalance } },
//     { new: true }
//   )
//     .then(eq => {
//       eqBe = eq;
//       return eq.currentBalance();
//     })
//     .then(balance => {
//       console.log(balance);
//       let tosend = _.pick(eqBe, [
//         "name",
//         "_id",
//         "user",
//         "initialBalance",
//         "type",
//         "currency"
//       ]);
//       tosend.currentBalance = balance;
//       res.status(200).send(tosend);
//     })
//     .catch(error => {});
// });
//
// app.post("/api/equities", authMiddleWare, (req, res) => {
//   let { name, type, initialBalance, currency } = req.body;
//   // console.log(name, type);
//   let equity = new Equity({
//     name,
//     type,
//     initialBalance,
//     currency
//   });
//
//   let rawEq;
//
//   equity.user = req.loggedInUser._id;
//   // console.log('equity');
//   equity
//     .save()
//     .then(eq => {
//       rawEq = eq;
//       return eq.currentBalance();
//     })
//     .then(currentBalance => {
//       let f = _.pick(rawEq, ["name", "type", "_id", "user", "initialBalance"]);
//
//       f.currentBalance = currentBalance;
//
//       return res.status(201).send(f);
//     })
//     .catch(error => {
//       if (_.includes(error.message, "Equity validation failed"))
//         return res.status(409).send({ message: "field validation failed" });
//
//       return res.sendStatus(500);
//     });
// });
//
//

//
// app.put('/api/user', authMiddleWare, (request, response)=>{
//
//   let { _id, name } = request.body;
//
//   let loggedInUser = request.loggedInUser;
//
//   User.findOne({ _id })
//     .then(user => {
//       if(!user._id.equals(loggedInUser._id))
//         response.sendStatus(403);
//
//       return User.findOneAndUpdate({_id}, {$set: {name}}, {new: true})
//
//     })
//     .then(userke => response.status(200).send(userke))
//     .catch(error => {
//       console.log(error);
//       response.status(500).send({error});
//     });
//
// });
//
// app.delete('/api/user/:id', authMiddleWare, (request, response)=>{
//
// let loggedInUser = request.loggedInUser;
//
//   User.findOne({ _id: request.params['id'] })
//     .then(user => {
//       console.log(user);
//       if(!user._id.equals(loggedInUser._id))
//         response.sendStatus(403);
//
//       return user.remove( );
//
//     })
//     .then(() => response.status(200).send())
//     .catch(error => {
//       console.log(error);
//       response.status(500).send({error});
//     });
//
//
// });
//
//
// app.delete('/api/equities/:id', authMiddleWare, (request, response)=>{
//
//   let { loggedInUser } = request;
//
//   Equity.findOne({ _id : request.params['id'] })
//     .then(equity => {
//
//       if(!equity)
//         return response.status(404).send({error: 'resource not found'});
//
//       if(!equity.user.equals(loggedInUser._id))
//         response.status(403).send({error: 'auth'});
//
//       return equity.remove();
//     })
//     .then(g => response.sendStatus(200))
//     .catch(error => {
//       console.log(error);
//     });
//
//
// });
//
// app.get('/api/equities', authMiddleWare, (request, response)=>{
//
//   let { loggedInUser } = request;
//
//   Equity.find({ _id: loggedInUser._id })
//     .then(equities => {
//       // if(!equity.user.equals(loggedInUser._id))
//       //   response.status(403).send({error: 'auth'});
//
//       return response.status(200).send(equities);
//     })
//     .catch(error => {
//       console.log(error);
//     });
//
//
// });
// app.get('/api/equities/:id', authMiddleWare, (request, response)=>{});

module.exports = { app };
