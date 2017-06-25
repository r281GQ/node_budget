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

  let transaction, new_account, newGrouping;

  let tobesentback;

  Promise.all([
    Transaction.findOne({ _id, user }).populate("account grouping"),
    Account.findOne({ _id: account }),
    Grouping.findOne({ _id: grouping })
  ])
    .then(queries => {

      transaction = queries[0];
      if(!transaction)
        return Promise.reject({message: RESOURCE_NOT_FOUND})
      new_account = queries[1];
      newGrouping = queries[2];
      tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);
      return Promise.all([
        new_account.currentBalance(),
        transaction.account.currentBalance()
      ]);
    })
    // Transaction.findOne({ _id }).populate('account grouping')
    .then(stuff => {
      // let transaction = stuff [0];
      // let newAccount = stuff[1];
      // let newGrouping = stuff[2];
      // tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);
      let oldbal = stuff[1];
      let newbal = stuff[0];

      console.log("balance:", oldbal, newbal);

      let oldAccountId = transaction.account._id;
      let oldGrouping = transaction.grouping;

      let areAccountstheSame = oldAccountId.equals(new_account._id);

      //TODO: actually only ttpyes need to be the same
      // let areGroupingsstheSame = oldGrouping._id.equals(newGrouping._id);
      let areGroupingsstheSame = oldGrouping.type === newGrouping.type;
      console.log("PRE:", oldGrouping, newGrouping);

      let newAmount = amount;
      let oldAmount = transaction.amount;

      if (
        areAccountstheSame &&
        areGroupingsstheSame &&
        newGrouping.type === "income"
      ) {
        let diff = oldAmount - newAmount;
        if (oldbal - diff > 0) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      if (
        areAccountstheSame &&
        areGroupingsstheSame &&
        newGrouping.type === "expense"
      ) {
        let diff = newAmount - oldAmount;
        console.log("diff:", diff);
        console.log(oldbal - diff);
        let g = oldbal - diff >= 0;
        console.log("ggg", g);
        if (g) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      //
      // account same old income new expense
      // old value 100 new 200 diff 300
      // currentBalance - dif > 0
      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "income" &&
        newGrouping.type === "expense"
      ) {
        console.log("accountsame, groupings not, old income, new expense");
        let diff = newAmount + oldAmount;
        console.log("diff:", diff);
        console.log(oldbal - diff);
        let g = oldbal - diff > 0;
        console.log("ggg", g);
        if (g) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          console.log("error");
          // return response.status(302).send({r: 'dfgdf'});
          // return new Error('wont be enough stex');
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      //
      // account same old expense new income
      // done

      if (
        areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "expense" &&
        newGrouping.type === "income"
      ) {
        console.log("accountsame, groupings not, old expense, new income");
        // let diff=newAmount+oldAmount;
        // console.log('diff:',diff);
        // console.log(oldbal - diff);
        // let g = oldbal - diff > 0;
        // console.log('ggg', g);
        // if(g){
        tobesentback.account = account;
        tobesentback.grouping = newGrouping;
        tobesentback.amount = amount;
        tobesentback.name = name;

        if (equity) tobesentback.equity = equity;

        if (budget) tobesentback.budget = budget;
        return Transaction.remove({ _id });
        // }else {
        //   console.log('error');
        //   // return response.status(302).send({r: 'dfgdf'});
        //   // return new Error('wont be enough stex');
        //   return Promise.reject('balance');
        // }
      }

      //
      // account diff both are income
      // oldaccountcurrentBlanace - oldavelue > 0
      //

      if (
        !areAccountstheSame &&
        areGroupingsstheSame &&
        oldGrouping.type === "income"
      ) {
        console.log("DIFFERENT ACCOUNT SAME TYPE OF GR, INCOME");
        let diff = newAmount + oldAmount;
        console.log("diff:", diff);
        console.log(oldbal - diff);
        let g = oldbal - oldAmount > 0;
        console.log("ggg", g);
        if (g) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          console.log("error");
          // return response.status(302).send({r: 'dfgdf'});
          // return new Error('wont be enough stex');
          return Promise.reject("balance");
        }
      }

      //
      // account diff both are expenese
      // newaccountcurrentbalance - newvalie > 0

      if (
        !areAccountstheSame &&
        areGroupingsstheSame &&
        oldGrouping.type === "expense"
      ) {
        console.log("DIFFERENT ACCOUNT SAME TYPE OF GR, EXPENSE");
        let diff = newAmount + oldAmount;
        console.log("diff:", diff);
        console.log(oldbal - diff);
        let g = newbal - newAmount >= 0;
        console.log("ggg", g);
        if (g) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          console.log("error");
          // return response.status(302).send({r: 'dfgdf'});
          // return new Error('wont be enough stex');
          return Promise.reject(ACCOUNT_BALANCE);
        }
      }

      // account diff old expense new income
      // done
      //TODO: UNIT TEST NEEDED
      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "expense" &&
        newGrouping.type === "income"
      ) {
        // let diff=newAmount+oldAmount;
        // console.log('diff:',diff);
        // console.log(oldbal - diff);
        // let g = newbal - newAmount > 0;
        // console.log('ggg', g);
        // if(g){
        tobesentback.account = account;
        tobesentback.grouping = newGrouping;
        tobesentback.amount = amount;
        tobesentback.name = name;

        if (equity) tobesentback.equity = equity;

        if (budget) tobesentback.budget = budget;
        return Transaction.remove({ _id });
        // }else {
        //   console.log('error');
        //   // return response.status(302).send({r: 'dfgdf'});
        //   // return new Error('wont be enough stex');
        //   return Promise.reject('balance');
        // }
      }

      // account diff old income new expense
      // oldaccountbalance - oldvlaie > o && newbalance - newvale > 0
      //TODO: UNIT TEST NEEDED
      if (
        !areAccountstheSame &&
        !areGroupingsstheSame &&
        oldGrouping.type === "income" &&
        newGrouping.type === "expense"
      ) {
        // let diff=newAmount+oldAmount;
        // console.log('diff:',diff);
        // console.log(oldbal - diff);
        let g = newbal - newAmount >= 0 && oldbal - oldAmount >= 0;
        // console.log('ggg', g);
        if (g) {
          tobesentback.account = account;
          tobesentback.grouping = newGrouping;
          tobesentback.amount = amount;
          tobesentback.name = name;

          if (equity) tobesentback.equity = equity;

          if (budget) tobesentback.budget = budget;
          return Transaction.remove({ _id });
        } else {
          console.log("error");
          // return response.status(302).send({r: 'dfgdf'});
          // return new Error('wont be enough stex');
          return Promise.reject("balance");
        }
      }

      // return Transaction.remove({_id});
    })
    .then(() => {
      console.log("after removal");
      let news = new Transaction({
        _id: tobesentback._id,
        name: tobesentback.name,
        date: tobesentback.date,
        amount: tobesentback.amount
      });
      news.account = tobesentback.account;
      news.grouping = tobesentback.grouping;
      news.user = tobesentback.user;

      if (tobesentback.budget) news.budget = tobesentback.budget;

      // console.log('NEW GR', news.grouping, grouping);

      return news.save();
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
      // return response.status(409).send({});
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
