const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

const { updateTransction } = require("./db/queries/transaction-update");
const { mongoose } = require("./db/mongooseConfig");
const { User } = require("./db/user");
const { Transaction } = require("./db/transaction");
const { Account } = require("./db/account");
const { Grouping } = require("./db/grouping");
const { Budget } = require("./db/budget");

const secret = "secret";

var app = express();

app.use(bodyParser.json());

app.listen(3000, () => {
  console.log("Server started on port: " + 3000);
});

app.post("/api/signUp", (request, response) => {
  let user = new User({
    name: request.body.name,
    email: request.body.email,
    password: request.body.password
  });

  user.save().then(user => {
    response.status(201).send(_.pick(user, ["name", "email"]));
  });
});

const authMiddleWare = (request, response, next) => {
  let token = request.header("x-auth");
  jwt.verify(token, secret, (error, loggedInUser) => {
    if (error) return response.sendStatus(403);
    request.loggedInUser = loggedInUser;
    next();
  });
};

app.post("/api/logIn", (request, response) => {
  let email = request.body.email;
  User.findOne({ email })
    .then(user => {
      if (user.password === request.body.password) {
        let userToSend = {
          name: user.name,
          email: user.email,
          _id: user._id
        };
        let token = jwt.sign(userToSend, secret);
        return response.append("x-auth", token).status(200).end();
      }

      return response.status(401).end();
    })
    .catch(() => response.status(404).end());
});

app.post("/api/account", authMiddleWare, (request, response) => {
  let rawAccount = {
    name: request.body.name,
    balance: request.body.balance
  };

  let dependencies = {
    user: request.user
  };

  let account = new Account({
    name: rawAccount.name,
    balance: rawAccount.balance
  });

  account.user = dependencies.user;

  account
    .save()
    .then((ac) => {
      return ac.mainBalance();
    })
    .then(main => {
      let r = _.pick(account, ["name", "_id", "balance"]);
      r.main = main;
      response.status(201).send(r);
    })
    .catch(error => console.log(error));
});

app.post("/api/grouping", (request, response) => {
  let rawGrouping = {
    name: request.body.name,
    type: request.body.type
  };

  let dependencies = {
    user: request.user
  };

  let grouping = new Grouping({
    name: rawGrouping.name,
    type: rawGrouping.type
  });

  grouping = dependencies.user;

  grouping
    .save()
    .then(() => {
      response.send(_.pick(grouping, ["name", "type", "_id"]));
    })
    .catch(error => console.log(error));
});

app.get("/api/grouping", (req, res) => {
  let accountsToSend;

  if (req.query.listTransactions && req.query.listTransactions === "true") {
    Promise.all([
      Grouping.find({}).sort({ name: 1 }),
      Transaction.find({}).populate("grouping")
    ])
      .then(datas => {
        let groupings = datas[0];
        let transactions = datas[1];
        res.send(
          _.map(groupings, grouping => {
            return _.extend({}, _.pick(grouping, ["name", "type", "_id"]), {
              transatcion: _.filter(transactions, tx =>
                tx.grouping._id.equals(grouping._id)
              )
            });
          })
        );
      })
      .catch(error => console.log(error));
  } else {
    Grouping.find({})
      .sort({ name: 1 })
      .then(groupings =>
        res.send(
          _.map(groupings, grouping =>
            _.pick(grouping, ["name", "type", "_id"])
          )
        )
      )
      .catch(error => console.log(error));
  }
});

app.get("/api/transaction", authMiddleWare, (request, response) => {
  let { loggedInUser } = request;

  Transaction.find({ user: loggedInUser._id })
    .populate("user account grouping equity")
    .then(transactions => {
      return response.status(200).send(transactions);
    })
    .catch(error => response.status(500).send(error));
});

app.put("/api/transaction", authMiddleWare, (request, response) => {
  let oldTransactionId = request.body._id;


  let tobesentback;
  Transaction.findOne({ _id: oldTransactionId })
    .populate("grouping")
    .then(transaction => {
      tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);

      tobesentback.account = request.body.account;
      tobesentback.grouping = request.body.grouping;
      tobesentback.amount = request.body.amount;
      tobesentback.name = request.body.name;

      if (request.body.equity) tobesentback.equity = request.body.equity;

      if (request.body.budget) tobesentback.budget = request.body.budget;

      return transaction.remove();
    })
    .then(() => {
      let news = new Transaction({
        _id: tobesentback._id,
        name: tobesentback.name,
        date: tobesentback.date,
        amount: tobesentback.amount
      });
      news.account = tobesentback.account;
      news.grouping = tobesentback.grouping;
      news.user = tobesentback.user;

      return news.save();
    })
    .then(updatedTransaction => response.status(200).send(updatedTransaction))
    .catch(error => console.log(error));

});

app.get("/api/account", authMiddleWare, (req, res) => {
  let accountsToSend;

  let user = req.loggedInUser._id;

  console.log(user);

  Account.find({ user })
    .sort({ name: 1 })
    .then(accounts => {
      accountsToSend = accounts;
      return Promise.all(
        _.map(accounts, account => {
          return account.mainBalance();
        })
      );
    })
    .then(balances => {
      let reduced = _.map(accountsToSend, account =>
        _.pick(account, ["name", "_id"])
      );
      let newStuff = _.map(balances, b => {
        return { balance: b };
      });
      console.log(_.merge(reduced, newStuff));
      res.send(_.merge(reduced, newStuff));
    })
    .catch(error => console.log(error));
});

app.put("/api/account", authMiddleWare, (request, response) => {
  // let _id = request.body.id;
  //
  // let name = request.body.name;

  let accountToBeSent;

  Account.findOne( {_id: request.body._id})
    .then(account => {

      if(account.user.toString()!== request.loggedInUser._id)
        return response.sendStatus(403);

      return Account.findOneAndUpdate({ _id: account._id }, { $set: { name: request.body.name } }, { new: true });

    })
    .then(account => {
      accountToBeSent = account;
      return account.mainBalance();
    })
    .then(mainBalance => {
      response.send(
        _.extend(_.pick(accountToBeSent, ["name", "_id"]), { balance: mainBalance }));
    })
    .catch(error => console.log(error));

  // Account.findOneAndUpdate({ _id }, { $set: { name } }, { new: true })
  //   .then(account => {
  //     accountToBeSent = account;
  //     return account.mainBalance();
  //   })
  //   .then(mainBalance => {
  //     response.send(
  //       _.extend(_.pick(accountToBeSent, ["name"], { balance: mainBalance }))
  //     );
  //   })
  //   .catch(error => console.log(error));
});

app.post("/api/transaction", authMiddleWare, (request, response) => {


  let tx = new Transaction({
    name: request.body.name,
    amount: request.body.amount
  });
  tx.user = request.loggedInUser._id;
  tx.account = request.body.account;
  tx.grouping = request.body.grouping;

  tx.save()
    .then(tx => {
      return response.status(201).send(tx);

    })
    .catch((err) => {
      // console.log(err);
      if(err.message === 'Account balance is too low!')
        return response.status(409).send({message: err.message});
      return response.sendStatus(500);
    })

});

app.delete("/api/transaction/:id", authMiddleWare, (request, response) => {

  Transaction.findOne({ _id: request.params['id']})
    .then(transaction => {
      if(transaction.user.toString() !== request.loggedInUser._id)
        return response.sendStatus(403);
      return transaction.remove();
    })
    .then(() => {
      return response.sendStatus(200);
    })
    .catch(error => response.sendStatus(500));
});

app.delete("/api/account/:id", authMiddleWare, (request, response) => {

  Account.findOne({ _id: request.params['id']})
    .then(account => {
      if(account.user.toString() !== request.loggedInUser._id)
        return response.sendStatus(403);
      return account.remove();
    })
    .then(() => {
      return response.sendStatus(200);
    })
    .catch(error => response.sendStatus(500));
});

app.get("/api/account/:id", authMiddleWare, (request, response) => {
  let ac;

  Account.findOne({ _id: request.params["id"] })
    .then(account => {
      if(account.user.toString() !== request.loggedInUser._id)
        return response.sendStatus(403);

      ac = account;
      return account.mainBalance();
    })
    .then(balance => {
      response.status(200).send(_.extend(_.pick(ac, ["name"]), { balance: balance }));
    })
    .catch(error => response.sendStatus(500));
});

app.put(`/api/budget`, authMiddleWare, (request, response) => {

  if (request.loggedInUser._id !== budget.user.toString())
    return response.sendStatus(403);

  // Budget.findOneAndUpdate({_id: request.body._id}, {$set: {name: request.body.name }  }, {new: true})
  //   .then()

});


app.put(`/api/budgetPeriod`, authMiddleWare, (request, response) => {

  if (request.loggedInUser._id !== budget.user.toString())
    return response.sendStatus(403);

  // Budget.findOneAndUpdate({_id: request.body._id, budgetPeriods._id: request.body.budgetPeriod._id}, {$set: {name: request.body.name } }, {new: true})
  //   .then()

});

app.get(`/api/budget/:id`, authMiddleWare, (request, response) => {
  Budget.findOne({ _id: request.params["id"] })
    .then(budget => {
      if (request.loggedInUser._id !== budget.user.toString())
        return response.sendStatus(403);

      return response
        .status(200)
        .send(_.pick(budget, ["name", "budgetPeriods"]));
    })
    .catch(() => response.sendStatus(404));
});

module.exports = { app };
