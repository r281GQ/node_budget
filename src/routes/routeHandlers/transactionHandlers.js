const _ = require("lodash");

const {
  Transaction,
  Grouping,
  Account,
  Budget,
  Equity
} = require("./../../db/models");
const {
  ID_INVALID_OR_NOT_PRESENT,
  FORBIDDEN_RESOURCE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  ACCOUNT_BALANCE,
  DEPENDENCIES_NOT_MET,
  BUDGET_INCOME_CONFLICT
} = require("./../../misc/errors");
const { idValidator, extractUser } = require("./../../misc/utils");

const handleGetAllTransactions = (request, response) => {
  let user = extractUser(request);

  Transaction.find({ user })
    .sort({ date: 1 })
    .then(transactions => {
      return response.status(200).send(transactions);
    })
    .catch(error => {
      return response.status(500).send({ error: SERVER_ERROR });
    });
};

const handlePutTransaction = (request, response) => {
  let user = extractUser(request);
  let {
    _id,
    name,
    amount,
    grouping,
    account,
    equity,
    budget,
    currency
  } = request.body;

  if (
    !idValidator(_id) ||
    !idValidator(grouping) ||
    !idValidator(account) ||
    (budget && !idValidator(budget)) ||
    (equity && !idValidator(equity))
  )
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  let newTransaction = {
    _id,
    name,
    amount,
    grouping,
    account,
    equity,
    budget,
    currency
  };

  let transaction, new_account, new_grouping, date;

  Promise.all([
    Transaction.findOne({ _id, user }).populate("account grouping"),
    Account.findOne({ _id: account, user }),
    Grouping.findOne({ _id: grouping, user })
  ])
    .then(queries => {
      transaction = queries[0];
      new_account = queries[1];
      grouping = new_grouping = queries[2];
      if (!transaction || !new_account || !new_grouping)
        return Promise.reject({ message: RESOURCE_NOT_FOUND });
      date = transaction.date;
      return Promise.all([
        new_account.currentBalance(),
        transaction.account.currentBalance()
      ]);
    })
    .then(balances => {
      let oldBalance = balances[1];
      let newBalance = balances[0];

      let oldAccount = transaction.account;
      let oldGrouping = transaction.grouping;

      const areAccountstheSame = oldAccount._id.equals(new_account._id);

      const areGroupingsstheSame = oldGrouping.type === new_grouping.type;

      const isOldGroupingIncome = oldGrouping.type === "income";

      const isNewGroupingIncome = new_grouping.type === "income";

      let newAmount = amount;
      let oldAmount = transaction.amount;

      if (areAccountstheSame && areGroupingsstheSame && isNewGroupingIncome)
        return oldBalance - (oldAmount - newAmount) > 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });

      if (areAccountstheSame && areGroupingsstheSame && !isNewGroupingIncome)
        return oldBalance - (newAmount - oldAmount) >= 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });

      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        isOldGroupingIncome &&
        !isNewGroupingIncome
      )
        return oldBalance - (newAmount + oldAmount) > 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });

      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        !isOldGroupingIncome &&
        isNewGroupingIncome
      )
        return Transaction.remove({ _id });

      if (!areAccountstheSame && areGroupingsstheSame && isOldGroupingIncome)
        return oldBalance - oldAmount > 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });

      if (!areAccountstheSame && areGroupingsstheSame && !isOldGroupingIncome)
        return newBalance - newAmount >= 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });

      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        !isOldGroupingIncome &&
        isNewGroupingIncome
      )
        return Transaction.remove({ _id });

      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        isOldGroupingIncome &&
        !isNewGroupingIncome
      )
        return newBalance - newAmount >= 0 && oldBalance - oldAmount >= 0
          ? Transaction.remove({ _id })
          : Promise.reject({ message: ACCOUNT_BALANCE });
    })
    .then(() => {
      let toCreate = new Transaction({
        _id,
        name,
        date,
        amount
      });

      toCreate.account = account;
      toCreate.grouping = grouping;
      toCreate.user = user;

      if (budget) toCreate.budget = budget;
      if (equity) toCreate.equity = equity;

      return toCreate.save();
    })
    .then(updatedTransaction => {
      const toSend = _.pick(updatedTransaction, [
        "_id",
        "name",
        "amount",
        "memo",
        "date",
        "currency",
        "account",
        "grouping",
        "budget",
        "equity"
      ]);
      toSend.grouping = updatedTransaction.grouping._id;
      return response.status(200).send(toSend);
    })
    .catch(error => {
      switch (error.message) {
        case ACCOUNT_BALANCE:
          return response.status(400).send({ error: ACCOUNT_BALANCE });
        case DEPENDENCIES_NOT_MET:
          return response.status(400).send({ error: DEPENDENCIES_NOT_MET });
        case BUDGET_INCOME_CONFLICT:
          return response.status(400).send({ error: BUDGET_INCOME_CONFLICT });
        case RESOURCE_NOT_FOUND:
          return response.status(400).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handlePostTransaction = (request, response) => {
  let user = extractUser(request);
  let {
    name,
    amount,
    grouping,
    account,
    equity,
    budget,
    currency,
    memo
  } = request.body;

  let transaction = new Transaction({
    name,
    amount,
    memo,
    currency
  });

  transaction.user = user;
  transaction.account = account;
  transaction.grouping = grouping;

  if (budget) transaction.budget = budget;
  if (equity) transaction.equity = equity;

  if (
    !idValidator(grouping) ||
    !idValidator(account) ||
    (budget && !idValidator(budget)) ||
    (equity && !idValidator(equity))
  )
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  //TODO: needs to find a way to get rid of scattered grouping populate code and do it in one place
  Grouping.findOne({ _id: transaction.grouping, user })
    .then(grouping => {
      if (!grouping) return Promise.reject({ message: DEPENDENCIES_NOT_MET });
      transaction.grouping = grouping;
      return transaction.save();
    })
    .then(transaction => {
      const toSend = _.pick(transaction, [
        "_id",
        "name",
        "amount",
        "memo",
        "date",
        "currency",
        "account",
        "grouping",
        "budget",
        "equity"
      ]);
      return response.status(201).send(toSend);
    })
    .catch(error => {
      switch (error.message) {
        case ACCOUNT_BALANCE:
          return response.status(400).send({ error: ACCOUNT_BALANCE });
        case DEPENDENCIES_NOT_MET:
          return response.status(400).send({ error: DEPENDENCIES_NOT_MET });
        case BUDGET_INCOME_CONFLICT:
          return response.status(400).send({ error: BUDGET_INCOME_CONFLICT });
        case RESOURCE_NOT_FOUND:
          return response.status(400).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handleDeleteTransaction = (request, response) => {
  let user = extractUser(request);
  const _id = request.params["id"];
  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Transaction.findOne({ _id, user })
    .populate("grouping")
    .then(transaction => {
      if (!transaction) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      if (!transaction.user.equals(request.loggedInUser._id))
        return Promise.reject({ message: FORBIDDEN_RESOURCE });
      return transaction.remove();
    })
    .then(() => {
      return response.sendStatus(200);
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        case FORBIDDEN_RESOURCE:
          return response.status(403).send({ error: FORBIDDEN_RESOURCE });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handleGetTransaction = (request, response) => {
  const _id = request.params["id"];

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Transaction.findOne({ _id })
    .then(transaction => {
      if (!transaction)
        return response.status(404).send({ error: RESOURCE_NOT_FOUND });
      if (!transaction.user.equals(request.loggedInUser._id))
        return response.status(403).send({ error: FORBIDDEN_RESOURCE });

      response
        .status(200)
        .send(
          _.pick(transaction, [
            "_id",
            "amount",
            "user",
            "account",
            "grouping",
            "budget",
            "equity",
            "memo",
            "date",
            "currency"
          ])
        );
    })
    .catch(error => response.status(500).send({ error: SERVER_ERROR }));
};

module.exports = {
  handleDeleteTransaction,
  handlePutTransaction,
  handlePostTransaction,
  handleGetAllTransactions,
  handleGetTransaction
};
