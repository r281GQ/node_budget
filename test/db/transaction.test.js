const { expect } = require("chai");
const moment = require("moment");
const _ = require("lodash");

const { mongoose } = require("./../../src/db/mongooseConfig");
const {
  Budget,
  Equity,
  Transaction,
  User,
  Grouping,
  Account
} = require("./../../src/db/models");

const { ACCOUNT_BALANCE } = require("./../../src/misc/errors");

describe("Transaction", () => {
  let __user, __account, __grouping, __budget, __income, __salary;

  afterEach(done => {
    Transaction.remove({})
      .then(() =>
        Promise.all([
          Account.remove({}),
          Grouping.remove({}),
          Equity.remove({}),
          Budget.remove({}),
          User.remove({})
        ])
      )
      .then(() => done())
      .catch(error => done(error));
  });
  beforeEach(done => {
    Transaction.remove({})
      .then(() =>
        Promise.all([
          Account.remove({}),
          User.remove({}),
          Budget.remove({}),
          Grouping.remove({}),
          Equity.remove({})
        ])
      )
      .then(() => {
        let user = new User({
          name: "Endre",
          email: "endre@mail.com",
          password: "123"
        });

        return user.save();
      })
      .then(user => {
        __user = user;
        done();
      })
      .catch(error => done(error));
  });

  beforeEach(done => {
    let account = new Account({
      name: "main",
      initialBalance: 15
    });

    let budget = new Budget({
      name: "spending money",
      defaultAllowance: 100
    });

    let grouping = new Grouping({
      name: "salary",
      type: "expense"
    });

    budget.user = __user._id;
    account.user = __user._id;
    grouping.user = __user;

    Promise.all([budget.save(), account.save(), grouping.save()])
      .then(persistedItems => {
        __budget = persistedItems[0];
        __account = persistedItems[1];
        __grouping = persistedItems[2];

        let transaction = new Transaction({
          name: "current rent",
          amount: 10,
          currency: "GBP",
          date: moment("07-06-2017", "DD-MM-YYYY")
        });

        transaction.account = __account;
        transaction.grouping = __grouping;
        transaction.user = __user;
        transaction.budget = __budget;
        return transaction.save();
      })
      .then(transaction => {
        __transaction = transaction;
        done();
      })
      .catch(err => {
        done(err);
      });
  });

  it("should persist transaction to DB", done => {
    Account.findOne({ name: "main" })
      .then(accountUpdated => {
        return accountUpdated.currentBalance();
      })
      .then(mainBalance => {
        expect(mainBalance).to.equal(5);
        done();
      })
      .catch(error => done(error));
  });

  it("should not be able to persist to DB because balance would be too low on account", done => {
    let transaction = new Transaction({
      name: "current rent",
      amount: 10,
      currency: "GBP"
    });

    transaction.account = __account;
    transaction.grouping = __grouping;
    transaction.user = __user;
    transaction
      .save()
      .then(() => done(new Error()))
      .catch(error => new Promise((resolve, reject) => resolve(error)))
      .then(error => {
        expect(error.message).to.equal(ACCOUNT_BALANCE);
        done();
      })
      .catch(error => done(error));
  });

  it("should not be able to remove because balance would be to low on account", done => {
    let income = new Grouping({
      name: "salary",
      type: "income"
    });

    income.user = __user;

    income
      .save()
      .then(income => {
        __income = income;
        let transaction = new Transaction({
          name: "weekly salary",
          amount: 20,
          currency: "GBP"
        });
        transaction.account = __account;
        transaction.grouping = __income;
        transaction.user = __user;
        return transaction.save();
      })
      .then(transaction => {
        __salary = transaction;
        let expense = new Transaction({
          name: "current rent",
          amount: 30,
          currency: "GBP"
        });
        expense.account = __account;
        expense.grouping = __grouping;
        expense.user = __user;

        return expense.save();
      })
      .then(() => __salary.remove())
      .then(() => {
        done(new Error());
      })
      .catch(error => new Promise(resolve => resolve(error)))
      .then(error => {
        expect(error.message).to.equal(ACCOUNT_BALANCE);
        done();
      })
      .catch(error => done(error));
  });

  it("should create budgetPeriod despite it does not exist yet", done => {
    Budget.findOne({})
      .then(budget => {
        expect(budget.budgetPeriods.length).not.to.equal(0);
        done();
      })
      .catch(error => done(error));
  });
});
