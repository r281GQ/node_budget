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

xdescribe("Transaction", () => {
  let __user, __account, __grouping, __budget;

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
    Promise.all([
      Account.remove({}),
      Transaction.remove({}),
      Grouping.remove({}),
      User.remove({})
    ])
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

  it("should persist transaction to DB", done => {
    User.findOne({ name: "Endre" })
      .then(user => {
        let account = new Account({
          name: "main",
          initialBalance: 5
        });

        account.user = __user;

        let grouping = new Grouping({
          name: "salary",
          type: "income"
        });

        grouping.user = __user;

        return Promise.all([account.save(), grouping.save()]);
      })
      .then(dep => {
        __account = dep[0];
        __grouping = dep[1];

        let transaction = new Transaction({
          name: "current rent",
          amount: 10,
          currency: "GBP"
        });

        transaction.account = __account;
        transaction.grouping = __grouping;
        transaction.user = __user;
        return transaction.save();
      })
      .then(() => {
        return Account.findOne({ name: "main" });
      })
      .then(accountUpdated => {
        return accountUpdated.currentBalance();
      })
      .then(mainBalance => {
        expect(mainBalance).toBe(15);
        done();
      })
      .catch(error => done(error));
  });

  it("should not be able to persist to DB because balance is too low", done => {
    User.findOne({ name: "Endre" })
      .then(user => {
        let account = new Account({
          name: "main",
          initialBalance: 5
        });

        account.user = user;

        let grouping = new Grouping({
          name: "rent",
          type: "expense"
        });

        grouping.user = user;

        // let transaction = new Transaction({
        //     name: 'current rent',
        //     amount: 10,
        //     currency: 'GBP'
        // });
        //
        // transaction.account = account;
        // transaction.grouping = grouping;
        // transaction.user = user;

        return Promise.all([account.save(), grouping.save(), User.findOne({})]);
      })
      .then(persistedItems => {
        let account = persistedItems[0];
        let grouping = persistedItems[1];
        let user = persistedItems[2];

        let transaction = new Transaction({
          name: "current rent",
          amount: 10,
          currency: "GBP"
        });

        transaction.account = account;
        transaction.grouping = grouping;
        transaction.user = user;
        return transaction.save();
      })
      .then(() => {})
      .catch(error => new Promise((resolve, reject) => resolve(error)))
      .then(error => {
        expect(error.message).toBe(
          "On creating modifying or deleting a transaction would result in insufficient balance on one of the accounts."
        );
        done();
      })
      .catch(error => {});
  });

  it("should not be able to remove because balance is to low", done => {
    User.findOne({ name: "Endre" })
      .then(user => {
        let account = new Account({
          name: "main",
          initialBalance: 15
        });

        account.user = __user;

        let rent = new Grouping({
          name: "rent",
          type: "expense"
        });

        rent.user = __user;

        let salary = new Grouping({
          name: "salary",
          type: "income"
        });

        salary.user = __user;

        return Promise.all([account.save(), rent.save(), salary.save()]);
      })
      .then(dep => {
        let transaction2 = new Transaction({
          name: "weekly salary",
          amount: 20,
          currency: "GBP"
        });
        transaction2.account = dep[0];
        transaction2.grouping = dep[2];
        transaction2.user = __user;
        return transaction2.save();
      })
      .then(dep => {
        return Promise.all([
          Account.findOne({ name: "main" }),
          Grouping.findOne({ name: "rent" }),
          User.findOne({})
        ]);
      })
      .then(values => {
        let transaction = new Transaction({
          name: "current rent",
          amount: 30,
          currency: "GBP"
        });
        transaction.account = values[0];
        transaction.grouping = values[1];
        transaction.user = __user;

        return transaction.save();
      })
      .then(() => Transaction.findOne({ name: "weekly salary" }))
      .then(transaction => {
        return transaction.remove();
      })
      .then(() => {
        done();
      })
      .catch(error => {
        return new Promise((resolve, reject) => {
          resolve(error);
        });
      })
      .then(error => {
        expect(error.message).toBe(
          "On creating modifying or deleting a transaction would result in insufficient balance on one of the accounts."
        );
        done();
      })
      .catch(error => {});
  });

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
});
