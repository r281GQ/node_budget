const _ = require("lodash");
const { Transaction } = require("./../../db/models");

const handleGetAllTransaction = (request, response) => {
  let { loggedInUser } = request;

  Transaction.find({ user: loggedInUser._id })
    .populate("budget account grouping equity")
    .then(transactions => {
      return response.status(200).send(transactions);
    })
    .catch(error => response.status(500).send(error));
};

const handlePutTransaction = (request, response) => {
  // let { _id } = request.body;

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

  let tobesentback;
  Transaction.findOne({ _id })
    // .populate("grouping")
    .then(transaction => {
      tobesentback = _.pick(_.cloneDeep(transaction), ["date", "_id", "user"]);

      tobesentback.account = account;
      tobesentback.grouping = grouping;
      tobesentback.amount = amount;
      tobesentback.name = name;

      if (equity) tobesentback.equity = equity;

      if (budget) tobesentback.budget = budget;

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
    .catch(error => response.status(500).send({}));
};

const handlePostTransaction = (request, response) => {
  let { loggedInUser } = request;
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

  let tx = new Transaction({
    name,
    amount,
    memo,
    currency
  });
  tx.user = loggedInUser._id;
  tx.account = account;
  tx.grouping = grouping;

  tx
    .save()
    .then(tx => {
      return response.status(201).send(tx);
    })
    .catch(err => {
      // console.log(err);

      // if(err.message === 'Account balance is too low!')
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
      .catch(error => response.sendStatus(500));
}
