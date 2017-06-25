const _ = require("lodash");

const { Transaction, Grouping, Account, Budget, Equity } = require("./../../db/models");
const {
  ID_INVALID_OR_NOT_PRESENT,
  FORBIDDEN_RESOURCE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  ACCOUNT_BALANCE,
  DEPENDENCIES_NOT_MET,
  BUDGET_INCOME_CONFLICT
} = require("./error_messages");

const idValidator = _id => (_id ? /^[0-9a-fA-F]{24}$/.test(_id) : false);

const handleGetAllTransactions = (request, response) => {
  let { loggedInUser } = request;

  Transaction.find({ user: loggedInUser._id })
    .then(transactions => {
      return response.status(200).send(transactions);
    })
    .catch(error => {
      return response.status(500).send({ error: SERVER_ERROR });
    });
};

const handlePutTransaction = (request, response) => {
  let user = request.loggedInUser._id;
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

  if (!idValidator(_id))
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

  let transaction, new_account, newGrouping, date;


  Promise.all([
    Transaction.findOne({ _id, user }).populate("account grouping"),
    Account.findOne({ _id: account, user }),
    Grouping.findOne({ _id: grouping, user })
  ])
    .then(queries => {

      transaction = queries[0];
      new_account = queries[1];
      newGrouping = queries[2];
      grouping = queries[2];
      if(!transaction || !new_account || !newGrouping)
        return Promise.reject({message: RESOURCE_NOT_FOUND})
      date = transaction.date;
      return Promise.all([
        new_account.currentBalance(),
        transaction.account.currentBalance()
      ]);
    })
    .then(stuff => {
      let oldbal = stuff[1];
      let newbal = stuff[0];


      let oldAccountId = transaction.account._id;
      let oldGrouping = transaction.grouping;

      const areAccountstheSame = oldAccountId.equals(new_account._id);

      //TODO: actually only ttpyes need to be the same
      // let areGroupingsstheSame = oldGrouping._id.equals(newGrouping._id);
      const areGroupingsstheSame = oldGrouping.type === newGrouping.type;

      const isOldGroupingIncome = oldGrouping.type === 'income';

      const isNewGroupingIncome = newGrouping.type === 'income';

      let newAmount = amount;
      let oldAmount = transaction.amount;



      // switch(areAccountstheSame, areGroupingsstheSame, isNewGroupingIncome, isOldGroupingIncome){
      //   case areAccountstheSame && areGroupingsstheSame && isNewGroupingIncome:
      //     break console.log('innit');
      //     case areAccountstheSame && areGroupingsstheSame && !isNewGroupingIncome:
      //       break console.log('dfsd');
      // }

      if (
        areAccountstheSame &&
        areGroupingsstheSame &&
        isNewGroupingIncome
      )
      return oldbal - (oldAmount - newAmount) > 0 ? Transaction.remove({ _id }) :  Promise.reject(ACCOUNT_BALANCE);
        // let diff = oldAmount - newAmount;
        // if (oldbal - (oldAmount - newAmount) > 0) {
        //   return Transaction.remove({ _id });
        // } else {
        //   return Promise.reject(ACCOUNT_BALANCE);
        // }



      if (
        areAccountstheSame &&
        areGroupingsstheSame &&
        newGrouping.type === "expense"
      )
        return  oldbal - (newAmount - oldAmount) >= 0 ?  Transaction.remove({ _id }) :  Promise.reject(ACCOUNT_BALANCE);

      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "income" &&
        newGrouping.type === "expense"
      ) {
        let diff = newAmount + oldAmount;
        let g = oldbal - diff > 0;
        if (g) {
          return Transaction.remove({ _id });
        } else {
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "expense" &&
        newGrouping.type === "income"
      ) {
        return Transaction.remove({ _id });
      }

      if (
        !areAccountstheSame &&
        areGroupingsstheSame &&
        oldGrouping.type === "income"
      ) {
        let diff = newAmount + oldAmount;
        let g = oldbal - oldAmount > 0;
        if (g) {
          return Transaction.remove({ _id });
        } else {
          return Promise.reject("balance");
        }
      }

      if (
        !areAccountstheSame &&
        areGroupingsstheSame &&
        oldGrouping.type === "expense"
      ) {
        let diff = newAmount + oldAmount;
        let g = newbal - newAmount >= 0;
        if (g) {
          return Transaction.remove({ _id });
        } else {
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "expense" &&
        newGrouping.type === "income"
      ) {
        return Transaction.remove({ _id });
      }

      //TODO: UNIT TEST NEEDED
      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "income" &&
        newGrouping.type === "expense"
      ) {
        let g = newbal - newAmount >= 0 && oldbal - oldAmount >= 0;
        if (g) {
          return Transaction.remove({ _id });
        } else {
          return Promise.reject("balance");
        }
      }

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
      let sendabel = _.pick(updatedTransaction, [
        "_id",
        "name",
        "amount",
        "date",
        "account",
        "currency",
        "memo",
        "budget"
      ]);
      sendabel.grouping = updatedTransaction.grouping._id;
      return response.status(200).send(sendabel);
    })
    .catch(error => {
      switch (error) {
        case ACCOUNT_BALANCE:
          return response.status(409).send({ error: "balace" });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handlePostTransaction = (request, response) => {
  let { loggedInUser } = request;
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

  transaction.user = loggedInUser._id;
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

  transaction
    .save()
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
  const _id = request.params["id"];
  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Transaction.findOne({ _id })
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
