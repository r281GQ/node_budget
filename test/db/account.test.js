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

let __user, __account, __grouping;

describe("Account", () => {
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
      initialBalance: 100,
      currency: "GBP"
    });

    account.user = __user;

    account
      .save()
      .then(account => {
        __account = account;
        done();
      })
      .catch(error => done(error));
  });

  it("should retreive account from DB", done => {
    Account.find({})
      .then(accounts => {
        expect(accounts.length).to.equal(1);
        done();
      })
      .catch(error => done(error));
  });

  describe("with dependencies", () => {
    let __transaction1, __transaction2;

    beforeEach(done => {
      let grouping = new Grouping({
        name: "flat",
        type: "expense"
      });

      grouping.user = __user;

      grouping
        .save()
        .then(grouping => {

          __grouping = grouping;

          let transaction1 = new Transaction({
            name: "rent",
            amount: 10
          });

          let transaction2 = new Transaction({
            name: "bills",
            amount: 15
          });

          transaction1.user = __user;
          transaction1.account = __account;
          transaction1.grouping = __grouping;

          transaction2.user = __user;
          transaction2.account = __account;
          transaction2.grouping = __grouping;
          return Promise.all([transaction1.save(), transaction2.save()]);
        })
        .then(transactions => {
          __transaction1 = transactions[0];
          __transaction2 = transactions[1];
          done();
        })
        .catch(error => done(error));
    });

    it("should remove account and all transactions belong to account", done => {
      Account.findOne({ name: "main" })
        .then(account => account.remove())
        .then(() => Transaction.find({}))
        .then(transactions => {
          expect(transactions.length).to.equal(0);
          done();
        })
        .catch(error => done(error));
    });

    it("should retreive the current balance 75", done => {
      Account.findOne({ _id: __account._id })
        .then(account => account.currentBalance())
        .then(balance => {
          expect(balance).to.equal(75);
          done();
        })
        .catch(error => done(error));
    });
  });
});
