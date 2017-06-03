const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const { updateTransction } = require('./db/queries/transaction-update')
const { mongoose } = require('./db/mongooseConfig');
const { User } = require('./db/user');
const { Transaction } = require('./db/transaction');
const { Account } = require('./db/account');
const { Grouping } = require('./db/grouping');
const { Budget } = require('./db/budget');

const secret = 'secret';

var app = express();

app.use(bodyParser.json());

app.listen(3000, () => {
    console.log('Server started on port: ' + 3000);
});


app.post('/api/signUp', (request, response) => {
    let user = new User({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password
    });

    user.save()
        .then(user => {
            response.status(201).send(_.pick(user, ['name', 'email']));
        });
});

const authMiddleWare = (request, response, next) => {
  let token = request.header('x-auth');
  jwt.decrypt(token, secret, (retreivedUser, error) => {
    if(error)
      return null;

    request.loggedInUser = retreivedUser;
    next();
  });

};



app.post('/api/logIn', (request, response) => {
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
        return response.append('x-auth', token).status(200).end();
      }

      return response.status(401).end();
    })
    .catch(() => response.status(404).end());
});

app.post('/api/account', authMiddleWare, (request, response) => {



    let rawAccount = {
        name: request.body.name,
        balance: request.body.balance
    };

    let dependencies = {
        user: request.user
    }

    let account = new Account({
        name: rawAccount.name,
        balance: rawAccount.balance
    });

    account.user = dependencies.user;

    account.save()
        .then(() => {
            response.send(_.pick(account, ['name', '_id']))
        })
        .catch(error => console.log(error));

});

app.post('/api/grouping', (request, response) => {

    let rawGrouping = {
        name: request.body.name,
        type: request.body.type
    };

    let dependencies = {
        user: request.user
    }

    let grouping = new Grouping({
        name: rawGrouping.name,
        type: rawGrouping.type
    });

    grouping = dependencies.user;

    grouping.save()
        .then(() => {
            response.send(_.pick(grouping, ['name', 'type', '_id']))
        })
        .catch(error => console.log(error));

});

app.get('/api/grouping', (req, res) => {

    let accountsToSend;

    if (req.query.listTransactions && req.query.listTransactions === 'true') {
        Promise.all([Grouping.find({}).sort({ name: 1 }), Transaction.find({}).populate('grouping')])
            .then(datas => {

                let groupings = datas[0];
                let transactions = datas[1];
                res.send(_.map(groupings, grouping => {
                    return _.extend({}, _.pick(grouping, ['name', 'type', '_id']), { transatcion: _.filter(transactions, tx => tx.grouping._id.equals(grouping._id)) });
                }));
            })
            .catch(error => console.log(error));
    } else {
        Grouping.find({})
            .sort({ name: 1 })
            .then(groupings => res.send(_.map(groupings, grouping => _.pick(grouping, ['name', 'type', '_id']))))
            .catch(error => console.log(error));
    }
});

app.get('/api/transaction', authMiddleWare, (request, response) => {
  let user  = request.body.loggedInUser;

  let appliableQueries = {};

  if(request.query.filter) {

  }

  Transaction.find({ user: user._id})
    .then(transactions => {
      response.status(200).send(transactions);
    })
    .catch(error => console.log('error'));

});

app.put('/api/transaction', (request, response) => {
  let oldTransactionId = request.body._id;


//q1: could old id be used?
  let updatedTransaction = new Transaction({
    name: request.body.name,
    account: request.body.account,
    date: request.body.date,
    currency: request.body.currency,
    _id: request.body._id
  });
  Transaction.remove({ _id: oldTransactionId})
    .then(() => return Transaction.save(updateTransction))
    .then(transaction => Transaction.find({_id: transaction._id}).populate('account grouping budget equity'))
    .then(transaction => {
      return new Promise ((resolve, reject) => {

        let clonedTransaction = _.cloneDeep(transaction);

        let cutTransction = _.pick(clonedTransaction, ['name', '_id', 'memo']);
        let transactionToBeReturned = {
          equity: _.pick(transaction.equity, ['name, _id']),
          budget: _.pick(transaction.budget, ['name', '_id']),
          budgetPeriod: _.pick(transaction.budgetPeriod, ['allowance']),
          account: _.pick(transaction.account, ['name', '_id'])
        }


        resolve(_.merge(cutTransction, transactionToBeReturned));
      });
    })
    .then(transaction => response.status(200).send(_.pick(transaction))
    .catch(error => response.status(500).send(error));
});

app.get('/api/account', authMiddleWare,(req, res) => {

    let accountsToSend;

    let user = req.loggedInUser._id;

    Account.find({ user })
        .sort({ name: 1 })
        .then(accounts => {
            accountsToSend = accounts;
            return Promise.all(_.map(accounts, account => {
                return account.mainBalance();
            }));
        })
        .then(balances => {
            let reduced = _.map(accountsToSend, account => _.pick(account, ['name', '_id']));
            let newStuff = _.map(balances, b => { return { balance: b } });
            console.log(_.merge(reduced, newStuff));
            res.send(_.merge(reduced, newStuff));
        })
        .catch(error => console.log(error));
});

app.put('/api/account', (request, response) => {

    let _id = request.body.id;

    let name = request.body.name;

    let accountToBeSent;

    Account.findOneAndUpdate({ _id }, { $set: { name } }, { new: true })
        .then(account => {
            accountToBeSent = account;
            return account.mainBalance();
        })
        .then(mainBalance => {
            response.send(_.extend(_.pick(accountToBeSent, ['name'], { balance: mainBalance })));
        })
        .catch(error => console.log(error));

});

app.delete('/api/delete', (request, response) => {
    Account.remove({ _id: request.body.id })
        .then(() => response.status(200).send())
        .catch(error => console.log(error));
});

app.get('/api/account/:id', authMiddleWare, (request, response) => {

    let ac;

    let userId = request.loggedInUser._id;

    console.log(request.params['id']);

    Account.findOne({ _id: request.params['id'] })
        .then(account => {
            if(account.user !== userId)
              return response.status(403).end();

            ac = account;
            return account.mainBalance();
        })
        .then(balance => {
            response.send(_.extend(_.pick(ac, ['name']), { balance: balance }));
        })
        .catch(error => response.status(500).end());
});



app.get(`/api/budget/:id`, authMiddleWare, (request, response) => {
  Budget.findOne({_id: request.params['id']})
    .then(budget => {
      if(request.body.loggedInUser._id !== budget.user)
        return response.sendStatus(403);

      return response.status(200).send(_.pick(budget, ['name', 'budgetPeriods']));
    })
    .catch(() => response.sendStatus(404));
});

module.exports = { app };
