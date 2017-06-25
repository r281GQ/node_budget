const _ = require("lodash");
const objectIDValidator = require('mongoose').Types.ObjectId.isValid;
const { Transaction, Grouping, Account } = require("./../../db/models");

const handleGetAllTransaction = (request, response) => {
  let { loggedInUser } = request;



  Transaction.find({ user: loggedInUser._id })
    .then(transactions => {
      return response.status(200).send(transactions);
    })
    .catch(error => {
      return response.status(500).send({});
    });
};

const handlePutTransaction = (request, response) => {
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

  if (!_id) return response.status(409).send({ error: "_id must be provided" });

  // const _id = request.params["_id"];

  // if(!objectIDValidator(_id)){
  //   console.log(objectIDValidator(_id));
  //   return response.status(400).send({});
  // }
  // if( !id || !name ||  !am)

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

  console.log("GGGGGGGGGGGGGG", budget);
  let transaction, newAccount, newGrouping;

  let tobesentback;

  Promise.all([
    Transaction.findOne({ _id }).populate("account grouping"),
    Account.findOne({ _id: account }),
    Grouping.findOne({ _id: grouping })
  ])
    .then(stuff => {
      transaction = stuff[0];
      newAccount = stuff[1];
      newGrouping = stuff[2];
      console.log(newGrouping.type);
      console.log(budget);
      if (newGrouping.type === "income" && budget) {
        console.log("shiuld be rejeced");
        return Promise.reject("stuff");
      }
      tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);
      return Promise.all([
        newAccount.currentBalance(),
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

      let areAccountstheSame = oldAccountId.equals(newAccount._id);

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
          return Promise.reject("balance");
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
          console.log("error");
          // return response.status(302).send({r: 'dfgdf'});
          // return new Error('wont be enough stex');
          return Promise.reject("balance");
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
          return Promise.reject("balance");
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
          return Promise.reject("balance");
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
      console.log('from put', error.name);
      // if(error.name === 'CastError')
        return response.status(500).send({});
      // switch (error) {
      //   case "balance":
      //     return response.status(409).send({ error: "balace" });
      //   default:
      //     return response.status(500);
      // }
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

  let tx = new Transaction({
    name,
    amount,
    memo,
    currency
  });
  Grouping.findOne({ _id: grouping })
    .then(gr => {
      if (gr.type === "income" && budget) return Promise.reject("");
      tx.user = loggedInUser._id;
      tx.account = account;
      tx.grouping = gr;
      return tx.save();
    })
    .then(ty => {
      return Transaction.findOne({ _id: ty._id });
    })
    // console.log(tx);
    // tx
    //   .save()
    .then(tx => {
      return response.status(201).send(tx);
    })
    .catch(err => {
      // console.log('has been created');
      // console.log('ERROR', err);
      if (_.includes(err.message, "Account balance is too low!"))
        return response.status(409).send({ message: err.message });
      return response.sendStatus(500);
    });
};

const handleDeleteTransaction = (request, response) => {
  Transaction.findOne({ _id: request.params["id"] })
    .then(transaction => {
      if (!transaction.user.equals(request.loggedInUser._id))
        return response.sendStatus(403);
      return transaction.remove();
    })
    .then(() => {
      return response.sendStatus(200);
    })
    .catch(error => {
      response.status(409).send({ error: "not anouth balance on account" });
    });
};

const handleGetTransaction = (request, response) => {

  const _id = request.params["_id"];

  if(!objectIDValidator(_id))
    return response.status(400).send({});

  Transaction.findOne({ _id })
    .then(transaction => {
      if (!transaction.user.equals(request.loggedInUser._id))
        response.status(403).send();

      response
        .status(200)
        .send(
          _.pick(transaction, [
            "_id",
            "amount",
            "user",
            "account",
            "grouping",
            "memo",
            "creationDate",
            "currency"
          ])
        );
    })
    .catch(error => response.status(500).send({ error: "error" }));
};

module.exports = {
  handleDeleteTransaction,
  handlePutTransaction,
  handlePostTransaction,
  handleGetAllTransaction,
  handleGetTransaction
};
