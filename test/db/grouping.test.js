const { expect } = require("chai");
const _ = require("lodash");

const { mongoose } = require("./../../src/db/mongooseConfig");
const {
  Grouping,
  Budget,
  Equity,
  Transaction,
  User,
  Account
} = require("./../../src/db/models");
const { ACCOUNT_BALANCE } = require("./../../src/misc/errors");

describe("Grouping", () => {
  let __user, __account, __grouping;

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
          password: "123456"
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
    let grouping = new Grouping({
      name: "spending money",
      type: "expense"
    });

    let account = new Account({
      name: "main",
      initialBalance: 100
    });

    grouping.user = __user;

    account.user = __user;

    Promise.all([account.save(), grouping.save()])
      .then(persistedItems => {
        __account = persistedItems[0];
        __grouping = persistedItems[1];

        let transaction = new Transaction({
          name: "rent",
          amount: 50
        });

        transaction.grouping = __grouping;

        transaction.account = __account;

        transaction.user = __user;
        return transaction.save();
      })
      .then(() => done())
      .catch(error => {
        done(error);
      });
  });

  it("should be persisted to the database with the associated resources", done => {
    Transaction.findOne({ name: "rent" })
      .populate("user grouping")
      .then(transaction => {
        expect(transaction.grouping.name).to.equal("spending money");
        expect(transaction.user.name).equal("Endre");
        done();
      })
      .catch(error => done(error));
  });

  it("should remove grouping and all transactions belongs to grouping", done => {
    Grouping.findOne({ _id: __grouping._id })
      .then(grouping => {
        return grouping.remove();
      })
      .then(() => {
        return Transaction.find({});
      })
      .then(transaction => {
        expect(transaction.length).to.equal(0);
        return Account.findOne({ _id: __account._id });
      })
      .then(account => account.currentBalance())
      .then(balance => {
        expect(balance).to.equal(100);
        done();
      })
      .catch(error => done(error));
  });

  describe("another grouping created", () => {
    let __income;

    beforeEach(done => {
      let income = new Grouping({
        name: "income",
        type: "income"
      });

      income.user = __user;

      income
        .save()
        .then(grouping => {
          __income = grouping;
          let salary = new Transaction({
            name: "salary",
            amount: 500
          });

          salary.account = __account;
          salary.grouping = __income;
          salary.user = __user;
          return salary.save();
        })
        .then(() => {
          let expense = new Transaction({
            name: "expense",
            amount: 400
          });

          expense.account = __account;
          expense.grouping = __grouping;
          expense.user = __user;
          return expense.save();
        })
        .then(() => done())
        .catch(error => done(error));
    });

    it("should not be able to remove income expect ACCOUNT_BALANCE error", done => {
      Grouping.findOne({ _id: __income._id })
        .then(grouping => grouping.remove())
        .then(() => {
          done(new Error());
        })
        .catch(error => {
          return Promise.resolve(error);
        })
        .then(error => {
          expect(error.message).to.equal(ACCOUNT_BALANCE);
          done();
        })
        .catch(error => done(error));
    });
  });
});
