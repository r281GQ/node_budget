const _ = require("lodash");

const { Account } = require("./../../db/models");
const { idValidator, extractUser } = require("./../../misc/utils");
const {
  ID_INVALID_OR_NOT_PRESENT,
  FORBIDDEN_RESOURCE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  ACCOUNT_BALANCE,
  DEPENDENCIES_NOT_MET,
  BUDGET_INCOME_CONFLICT
} = require("./../../misc/errors");

const pickPropertiesForAccount = account =>
  _.pick(account, ["_id", "name", "initialBalance"]);

const handleGetAllAccounts = (request, response) => {
  let accountsToSend;
  const user = extractUser(request);

  Account.find({ user })
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
      response.status(500).send({ error: SERVER_ERROR });
    });
};

const handlePutAccount = (request, response) => {
  let { _id, name } = request.body;

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  const user = extractUser(request);

  let accountToSend;

  Account.findOne({ _id, user })
    .then(account => {
      if (!account) return Promise.reject({ message: RESOURCE_NOT_FOUND });

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
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handlePostAccount = (request, response) => {
  let { name, initialBalance, currency } = request.body;

  const user = extractUser(request);

  let account = new Account({
    name,
    initialBalance,
    currency
  });

  account.user = user;

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
      response.status(500).send({ error: SERVER_ERROR });
    });
};

const handleGetAccount = (request, response) => {
  let accountToSend;

  const user = extractUser(request);
  const _id = request.params["id"];

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Account.findOne({ _id, user })
    .then(account => {
      if (!account) return Promise.reject({ message: RESOURCE_NOT_FOUND });

      accountToSend = account;
      return account.currentBalance();
    })
    .then(currentBalance => {
      let reducedAccount = pickPropertiesForAccount(accountToSend);
      reducedAccount.currentBalance = currentBalance;

      return response.status(200).send(reducedAccount);
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handleDeleteAccount = (request, response) => {
  const user = extractUser(request);
  const _id = request.params["id"];

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Account.findOne({ _id, user })
    .then(account => {
      if (!account) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      return account.remove();
    })
    .then(() => {
      return response.status(200).send({});
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

module.exports = {
  handleGetAllAccounts,
  handlePutAccount,
  handlePostAccount,
  handleGetAccount,
  handleDeleteAccount
};
