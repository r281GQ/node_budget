const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const cors = require('cors');

const { mongoose } = require("./db/mongooseConfig");

const { updateTransction } = require("./db/queries/transaction-update");

const { accountRoutes } = require("./../src/routes/routes");

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

app.use(`${BASE_URL}${ACCOUNT_BASE_URL}`, accountRoutes);

// app.use(function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", 'http://localhost:3000');
//   res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,x-auth');
//
//   next();
// });

app.listen(2000, () => {
  console.log("Server started on port: " + 2000);
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
  let { email } = request.body;
  User.findOne({ email })
    .then(user => {

      let { password } = user;

      if (password === request.body.password) {
        let userToSend = _.pick(user, ["_id", "name", "email"]);
        let token = jwt.sign(userToSend, secret);
        return response.set("x-auth", token).status(200).send(userToSend);
        // return response.set("Access-Control-Expose-Headers").set("x-auth", token).status(200).send(userToSend);
      }

      return response.status(401).send({ message: "Wrong password provided!" });
    })
    .catch(() => response.status(404).send({ message: "No such user!" }));
});

// app.post("/api/grouping", authMiddleWare, (request, response) => {
//
//   let grouping = new Grouping({
//     name: request.body.name,
//     type: request.body.type
//   });
//
//   grouping.user = request.loggedInUser._id;
//
//   grouping
//     .save()
//     .then(gr => {
//       response.status(201).send(_.pick(gr, ["name", "type", "_id", "user"]));
//     })
//     .catch(error => console.log(error));
// });
//
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
// app.get("/api/grouping/:id", authMiddleWare, (req, res) => {
//   let accountsToSend;
//
//   Grouping.findOne({ _id: req.params["id"] })
//     .then(gr => {
//       if (!gr.user.equals(req.loggedInUser._id)) return res.sendStatus(403);
//
//       return res.status(200).send(gr);
//     })
//     .catch(error => res.sendStatus(500));
//
// });
//
// app.get("/api/transaction", authMiddleWare, (request, response) => {
//   let { loggedInUser } = request;
//
//   Transaction.find({ user: loggedInUser._id })
//     .populate("user account grouping equity")
//     .then(transactions => {
//       return response.status(200).send(transactions);
//     })
//     .catch(error => response.status(500).send(error));
// });
//
// app.put("/api/transaction", authMiddleWare, (request, response) => {
//   let oldTransactionId = request.body._id;
//
//   let tobesentback;
//   Transaction.findOne({ _id: oldTransactionId })
//     .populate("grouping")
//     .then(transaction => {
//       tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);
//
//       tobesentback.account = request.body.account;
//       tobesentback.grouping = request.body.grouping;
//       tobesentback.amount = request.body.amount;
//       tobesentback.name = request.body.name;
//
//       if (request.body.equity) tobesentback.equity = request.body.equity;
//
//       if (request.body.budget) tobesentback.budget = request.body.budget;
//
//       return transaction.remove();
//     })
//     .then(() => {
//       let news = new Transaction({
//         _id: tobesentback._id,
//         name: tobesentback.name,
//         date: tobesentback.date,
//         amount: tobesentback.amount
//       });
//       news.account = tobesentback.account;
//       news.grouping = tobesentback.grouping;
//       news.user = tobesentback.user;
//
//       return news.save();
//     })
//     .then(updatedTransaction => response.status(200).send(updatedTransaction))
//     .catch(error => console.log(error));
// });
//
//
//
// app.post("/api/transaction", authMiddleWare, (request, response) => {
//   let tx = new Transaction({
//     name: request.body.name,
//     amount: request.body.amount
//   });
//   tx.user = request.loggedInUser._id;
//   tx.account = request.body.account;
//   tx.grouping = request.body.grouping;
//
//   tx
//     .save()
//     .then(tx => {
//       return response.status(201).send(tx);
//     })
//     .catch(err => {
//       // console.log(err);
//
//       // if(err.message === 'Account balance is too low!')
//       if (_.includes(err.message, "Account balance is too low!"))
//         return response.status(409).send({ message: err.message });
//       return response.sendStatus(500);
//     });
// });
//
// app.delete("/api/transaction/:id", authMiddleWare, (request, response) => {
//   Transaction.findOne({ _id: request.params["id"] })
//     .then(transaction => {
//       if (!transaction.user.equals(request.loggedInUser._id))
//         return response.sendStatus(403);
//       return transaction.remove();
//     })
//     .then(() => {
//       return response.sendStatus(200);
//     })
//     .catch(error => response.sendStatus(500));
// });
//
// app.delete("/api/account/:id", authMiddleWare, (request, response) => {
//   Account.findOne({ _id: request.params["id"] })
//     .then(account => {
//       if (account.user.toString() !== request.loggedInUser._id)
//         return response.sendStatus(403);
//       return account.remove();
//     })
//     .then(() => {
//       return response.sendStatus(200);
//     })
//     .catch(error => response.sendStatus(500));
// });
//
// app.get("/api/account/:id", authMiddleWare, (request, response) => {
//   let ac;
//
//   Account.findOne({ _id: request.params["id"] })
//     .then(account => {
//       if (account.user.toString() !== request.loggedInUser._id)
//         return response.sendStatus(403);
//
//       ac = account;
//       return account.currentBalance();
//     })
//     .then(balance => {
//       response
//         .status(200)
//         .send(_.extend(_.pick(ac, [ "_id","name", "user", "balance"]), { currentBalance: balance }));
//     })
//     .catch(error => response.sendStatus(500));
// });
//
// app.put(`/api/budget`, authMiddleWare, (request, response) => {
//   if (request.loggedInUser._id !== budget.user.toString())
//     return response.sendStatus(403);
//
//   // Budget.findOneAndUpdate({_id: request.body._id}, {$set: {name: request.body.name }  }, {new: true})
//   //   .then()
// });
//
// app.put(`/api/budgetPeriod`, authMiddleWare, (request, response) => {
//   if (request.loggedInUser._id !== budget.user.toString())
//     return response.sendStatus(403);
//
//   // Budget.findOneAndUpdate({_id: request.body._id, budgetPeriods._id: request.body.budgetPeriod._id}, {$set: {name: request.body.name } }, {new: true})
//   //   .then()
// });
//
//
//
// app.get('/api/budget/:id', authMiddleWare, (request, response) => {
//
//   let tosen;
//   Budget.findOne({ _id: request.params["id"] })
//     .then(budget => {
//       if (request.loggedInUser._id !== budget.user.toString())
//         return response.sendStatus(403);
//         tosen = budget;
//         console.log(budget.budgetPeriods);
//       return budget.balances();
//     })
//     .then(balances => {
//       console.log('balance:',  balances);
//
//       // console.log(_.pick(budget, ["name", "budgetPeriods"]));
//
//     return response
//       .status(200)
//       .send({});
//     })
//     .catch(() => response.sendStatus(404));
// });
//
// app.get('/api/transaction/:id', authMiddleWare, (request, response)=>{
//
//   Transaction.findOne({_id: request.params['_id']})
//     .then(transaction => {
//
//         if(!transaction.user.equals(request.loggedInUser._id))
//           response.status(403).send();
//
//       response.status(200).send(_.pick(transaction, ['_id', 'amount', 'user', 'account', 'grouping', 'memo', 'creationDate', 'currency']))
//     })
//
//     .catch(error => response.status(500).send({error: 'error'}));
//
//
// });
//
// app.post('/api/budget', authMiddleWare, (request, response)=>{
//   let { name, currency, defaultAllowance } = request.body;
//
//   let userId = request.loggedInUser._id;
//    let intermediate;
//   let budget = new Budget({
//     name,
//     currency,
//     defaultAllowance
//   });
//   budget.user = userId;
//
//   budget.save()
//     .then(bugset => {
//       intermediate = bugset;
//       return budget.balances();
//     })
//     .then(balances=> {
//       let g = _.pick(intermediate, ['_id', 'name', 'currency']);
//       g.budgetPeriods = balances;
//       response.status(201).send(g);
//     })
//     .catch(error => {
//       response.status(500).send({error: ''});
//     });
//
//
// });
//
// app.delete('/api/budget/:id', authMiddleWare, (request, response)=>{
//
//   let _id = request.params['id'];
//   let loggedInUser = request.loggedInUser;
//
//   Budget.findOne({ _id })
//     .then(budget => {
//         if(!budget.user.equals(loggedInUser._id))
//           response.status(403).send();
//         return budget.remove();
//     })
//     .then(() => {
//       response.status(200).send();
//     })
//     .catch(error => {
//
//     });
// });
//
// app.get('/api/budget', authMiddleWare, (request, response)=>{
//
//   let { loggedInUser } = request;
//
//   let intermediate;
//
//   //merge needs an object to assicate with an onther array same object
//
//   Budget.find({ user: loggedInUser._id })
//     .then(budgets => {
//       intermediate = budgets;
//       return Promise.all(_.map(budgets, budget => budget.balances()));
//     })
//     .then(enhancedBPS => {
//       // console.log(enhancedBPS);
//       let enhancedBPS1 = _.map(enhancedBPS, bps => {
//         return { bps };
//       });
//       // console.log(enhancedBPS1);
//       let tosend = _.map(intermediate, budget => _.pick(budget, ['name', 'currency', 'user', 'defaultAllowance']));
//       // console.log(tosend);
//       let fine = _.merge(tosend, enhancedBPS1);
//       // console.log(enhancedBPS);
//       // console.log(fine);
//       response.status(200).send(fine);
//     })
//     .catch((err) => response.status(500).send({}));
//
// });
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
// app.put('/api/grouping', authMiddleWare, (request, response)=>{
//   let { _id, name } = request.body;
//   let { loggedInUser } = request;
//
//   Grouping.findOne({ _id })
//     .then( grouping => {
//
//       if(!grouping.user.equals(loggedInUser._id))
//         response.status(403).send({error: 'auth'});
//
//       return Grouping.findOneAndUpdate(
//         { _id },
//         { $set: { name } },
//         { new: true }
//       );
//     })
//     .then(gr=> response.status(200).send(gr))
//     .catch(error => {});
// });
//
// app.delete('/api/grouping/:id', authMiddleWare, (request, response)=>{
//
//   let { loggedInUser } = request;
//   let _id = request.params['id'];
//
//   Grouping.findOne({ _id })
//     .then( grouping => {
//
//       if(!grouping.user.equals(loggedInUser._id))
//         response.status(403).send({error: 'auth'});
//
//       return grouping.remove();
//     })
//     .then(gr=> response.status(200).send(gr))
//     .catch(error => {});
//
//
// });
//
// app.get('/api/grouping', authMiddleWare, (request, response)=>{
//
//   let { loggedInUser } = request;
//
//   Grouping.find({user: loggedInUser._id})
//     .then(groupings =>{
//       response.status(200).send(groupings);
//     })
//     .catch(error => console.log(error));
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
