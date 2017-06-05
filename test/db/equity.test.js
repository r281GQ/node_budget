const {
  Equity,
  Budget,
  User,
  Transaction,
  Account,
  Grouping
} = require("./../../src/db/models");

const mongoose = require("./../../src/db/mongooseConfig");

const _ = require("lodash");
const expect = require("expect");

describe("equity", () => {

  afterEach(done => {
    Transaction.remove({})
    .then(() =>   Promise.all([
        Account.remove({}),
        Grouping.remove({}),
        Equity.remove({}),
        Budget.remove({}),
        User.remove({})
      ]))
    .then(() => done())
    .catch(error => done(error));
  });
  beforeEach(done => {
    Promise.all([
      Account.remove({}),
      User.remove({}),
      Grouping.remove({}),
      Transaction.remove({}),
      Equity.remove({})
    ])
      .then(() => {
        let sampleUser = new User({
          name: "Endre",
          email: "endre@mail.com",
          password: "123456"
        });
        return sampleUser.save();
      })
      .then(() => done())
      .catch(error => done(error));
  });

  it("should return 1050 on asset && expense", done => {
    User.findOne({ name: "Endre" })
      .then(user => {
        let account = new Account({
          name: "main",
          balance: 100,
          currency: "GBP"
        });
        account.user = user;

        let grouping = new Grouping({
          name: "rent",
          type: "expense"
        });

        grouping.user = user;

        let equity = new Equity({
          name: "betting",
          initialBalance: 1000,
          type: "asset",
          currency: "GBP"
        });

        equity.user = user;

        let tx = new Transaction({
          name: "test",
          amount: 50,
          currency: "GBP",
          memo: "test porpuses"
        });

        tx.user = user;
        tx.account = account;
        tx.equity = equity;
        tx.grouping = grouping;

        return Promise.all([
          account.save(),
          grouping.save(),
          equity.save(),
          tx.save()
        ]);
      })
      .then(() => {
        return Equity.findOne({ name: "betting" });
      })
      .then(equity => {
        return equity.bal();
      })
      .then(balance => {
        expect(balance).toBe(1050);
        done();
      })
      .catch(error => done(error));
  });

  it("should return 950 on liability && expense", done => {
    User.findOne({ name: "Endre" })
      .then(user => {
        let account = new Account({
          name: "main",
          balance: 100,
          currency: "GBP"
        });
        account.user = user;

        let grouping = new Grouping({
          name: "rent",
          type: "expense"
        });

        grouping.user = user;

        let equity = new Equity({
          name: "debt",
          initialBalance: 1000,
          type: "liability",
          currency: "GBP"
        });

        equity.user = user;

        let tx = new Transaction({
          name: "test",
          amount: 50,
          currency: "GBP",
          memo: "test porpuses"
        });

        tx.user = user;
        tx.account = account;
        tx.equity = equity;
        tx.grouping = grouping;

        return Promise.all([
          account.save(),
          grouping.save(),
          equity.save(),
          tx.save()
        ]);
      })
      .then(() => {
        return Equity.findOne({ name: "debt" });
      })
      .then(equity => {
        return equity.bal();
      })
      .then(balance => {
        expect(balance).toBe(950);
        done();
      })
      .catch(error => done(error));
  });
});
