const moment = require("moment");
const _ = require("lodash");
const { expect } = require("chai");

const {
  Equity,
  Budget,
  User,
  Transaction,
  Account,
  Grouping
} = require("./../../src/db/models");

const mongoose = require("./../../src/db/mongooseConfig");

describe("equity", () => {
  let __user,
    __account,
    __grouping,
    __budget,
    __income,
    __salary,
    __asset,
    __liability;

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
    let account = new Account({
      name: "main",
      initialBalance: 100
    });

    let budget = new Budget({
      name: "spending money",
      defaultAllowance: 100
    });

    let grouping = new Grouping({
      name: "expense",
      type: "expense"
    });

    let asset = new Equity({
      name: "betting",
      initialBalance: 1000,
      type: "asset",
      currency: "GBP"
    });

    let liability = new Equity({
      name: "debt",
      initialBalance: 1000,
      type: "liability",
      currency: "GBP"
    });

    liability.user = __user;

    asset.user = __user;
    budget.user = __user;
    account.user = __user;
    grouping.user = __user;

    Promise.all([
      budget.save(),
      account.save(),
      grouping.save(),
      asset.save(),
      liability.save()
    ])
      .then(persistedItems => {
        __budget = persistedItems[0];
        __account = persistedItems[1];
        __grouping = persistedItems[2];
        __asset = persistedItems[3];
        __liability = persistedItems[4];

        done();
      })
      .catch(err => {
        done(err);
      });
  });

  describe("transaction is asset", () => {
    beforeEach(done => {
      let transaction = new Transaction({
        name: "current rent",
        amount: 50,
        currency: "GBP",
        date: moment("07-06-2017", "DD-MM-YYYY")
      });

      transaction.account = __account;
      transaction.grouping = __grouping;
      transaction.user = __user;
      transaction.budget = __budget;
      transaction.equity = __asset;
      transaction
        .save()
        .then(() => {
          done();
        })
        .catch(error => done(error));
    });

    it("should return 1050 on asset && expense", done => {
      __asset
        .currentBalance()
        .then(balance => {
          expect(balance).to.equal(1050);
          done();
        })
        .catch(error => done(error));
    });
  });

  describe("transaction is liability", () => {
    beforeEach(done => {
      let transaction = new Transaction({
        name: "current rent",
        amount: 50,
        currency: "GBP",
        date: moment("07-06-2017", "DD-MM-YYYY")
      });

      transaction.account = __account;
      transaction.grouping = __grouping;
      transaction.user = __user;
      transaction.budget = __budget;
      transaction.equity = __liability;
      transaction
        .save()
        .then(() => {
          done();
        })
        .catch(error => done(error));
    });

    it("should return 950 on liability && expense", done => {
      __liability
        .currentBalance()
        .then(balance => {
          expect(balance).to.equal(950);
          done();
        })
        .catch(error => done(error));
    });
  });
});
