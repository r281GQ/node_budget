const _ = require("lodash");
const { Account } = require("./../../db/models");

const pickPropertiesForAccount = account =>
  _.pick(account, ["_id", "name", "initialBalance", "user"]);

const handleGetAllAccounts = (request, response) => {
  let accountsToSend;

  let { loggedInUser } = request;
  Account.find({ user: loggedInUser._id })
    .sort({ name: 1 })
    .then(accounts => {
        accountsToSend = accounts;
        return Promise.all(
          _.map(accounts, account => {
            return account.currentBalance();
          })
        );
    })
    .then(currentBalances => {
      let reduced = _.map(accountsToSend, account =>
        pickPropertiesForAccount(account)
      );
      let prefixedCurrentBalances = _.map(currentBalances, currentBalance => {
        return { currentBalance };
      });
      response.status(200).send(_.merge(reduced, prefixedCurrentBalances));
    })
    .catch(error => {
      response.status(500).send({ error });
    });
};

const handlePutAccount = (request, response) => {
  let { _id, name } = request.body;

  let { loggedInUser } = request;

  let accountToSend;

  Account.findOne({ _id })
    .then(account => {
      if (!account.user.equals(loggedInUser._id))
        return response.sendStatus(403);

      return Account.findOneAndUpdate(
        { _id },
        { $set: { name } },
        { new: true }
      );
    })
    .then(account => {
      accountToSend = account;
      return account.currentBalance();
    })
    .then(currentBalance => {
      response.send(
        _.extend(pickPropertiesForAccount(accountToSend), {
          currentBalance
        })
      );
    })
    .catch(error => {
      response.status(500).send({ error });
    });
};

const handlePostAccount = (request, response) => {
  let { name, initialBalance, currency } = request.body;

  let { loggedInUser } = request;

  let account = new Account({
    name,
    initialBalance,
    currency
  });

  account.user = loggedInUser._id;

  let accountToSend;

  account
    .save()
    .then(account => {
      accountToSend = account;
      return account.currentBalance();
    })
    .then(currentBalance => {
      let reducedAccount = pickPropertiesForAccount(accountToSend);
      reducedAccount.currentBalance = currentBalance;
      response.status(201).send(reducedAccount);
    })
    .catch(error => {
      response.status(500).send({ error });
    });
};

const handleGetAccount = (request, response) => {
  let accountToSend;

  Account.findOne({ _id: request.params["id"] })
    .then(account => {
      if (!account.user.equals(request.loggedInUser._id))
        response.sendStatus(403);

      accountToSend = account;
      return account.currentBalance();
    })
    .then(currentBalance => {
      let reducedAccount = pickPropertiesForAccount(accountToSend);
      reducedAccount.currentBalance = currentBalance;

      return response.status(200).send(reducedAccount);
    })
    .catch(error => response.sendStatus(500));
};

const handleDeleteAccount = (request, response) => {
  let { loggedInUser } = request;
  console.log("inside stuff");
  Account.findOne({ _id: request.params["id"] })
    .then(account => {
      console.log(account);
      if (!account.user.equals(loggedInUser._id))
        // console.log('aint');
        response.sendStatus(403);
      return account.remove();
    })
    .then(() => {
      console.log("IS");
      response.status(200).send();
    })
    .catch(error => response.sendStatus(500));
};

module.exports = {
  handleGetAllAccounts,
  handlePutAccount,
  handlePostAccount,
  handleGetAccount,
  handleDeleteAccount
};
