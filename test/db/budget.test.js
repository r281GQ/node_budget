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

describe("Budget", () => {
  let __user, __budget, __account, __grouping, __transaction;

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

  it("should update periods comulativeBalance on transaction creation", done => {
    Budget.findOne({})
      .then(budget => {
        budget.budgetPeriods = [
          {
            allowance: 100,
            month: moment("07-07-2017", "DD-MM-YYYY")
          },
          {
            allowance: 100,
            month: moment("06-06-2017", "DD-MM-YYYY")
          }
        ];
        return budget.save();
      })
      .then(budget => budget.balances())
      .then(balances => {
        const budgetPeriod = _.find(
          balances,
          balance =>
            moment(balance.month).format("MM-YYYY") ===
            moment(__transaction.date).format("MM-YYYY")
        );

        const followingBudgetPeriod = _.find(
          balances,
          balance =>
            moment(balance.month).format("MM-YYYY") ===
            moment(
              moment(_.cloneDeep(moment(__transaction.date))).add(1, "M")
            ).format("MM-YYYY")
        );

        expect(budgetPeriod.comulativeBalance).to.equal(90);
        expect(followingBudgetPeriod.comulativeBalance).to.equal(190);
      })
      .then(() => {
        done();
      })
      .catch(error => done(error));
  });

  it("should generate the current month", done => {
    let prevmonsth = moment().subtract(1, "M").valueOf();
    Budget.findOne({})
      .then(budget => {
        return budget.createInitialBudgetPeriods();
      })
      .then(budget => {
        expect(moment(budget.budgetPeriods[0].month).isSame(moment(), "M")).to
          .be.true;
        done();
      })
      .catch(error => done(error));
  });

  it("should generate the current month and the previous", done => {
    let previousMonth = moment().subtract(1, "M").valueOf();
    Budget.findOne({})
      .then(budget => {
        return budget.createInitialBudgetPeriods(previousMonth);
      })
      .then(budget => {
        expect(
          moment(budget.budgetPeriods[0].month).isSame(
            moment().subtract(1, "M"),
            "M"
          )
        ).to.be.true;
        expect(moment(budget.budgetPeriods[1].month).isSame(moment(), "M")).to
          .be.true;
        expect(budget.budgetPeriods.length).to.equal(2);
        done();
      })
      .catch(error => done(error));
  });

  it("should generate the one month prior to the current one", done => {
    Budget.findOne({})
      .then(budget => {
        return budget.createInitialBudgetPeriods();
      })
      .then(budget =>
        budget.assignBudgetPeriod(moment("03-03-2017", "DD-MM-YYYY"))
      )
      .then(budget => {
        expect(
          _.some(budget.budgetPeriods, bp =>
            moment(bp.month).isSame(moment("03-03-2017", "DD-MM-YYYY"), "M")
          )
        ).to.be.true;
        expect(
          _.some(budget.budgetPeriods, bp =>
            moment(bp.month).isSame(moment("03-04-2017", "DD-MM-YYYY"), "M")
          )
        ).to.be.true;
        expect(
          _.some(budget.budgetPeriods, bp =>
            moment(bp.month).isSame(moment("03-05-2017", "DD-MM-YYYY"), "M")
          )
        ).to.be.true;
        expect(
          _.some(budget.budgetPeriods, bp =>
            moment(bp.month).isSame(moment("03-06-2017", "DD-MM-YYYY"), "M")
          )
        ).to.be.true;
        expect(budget.budgetPeriods.length).to.equal(4);
        done();
      })
      .catch(error => done(error));
  });

  it("should update periods comulativeBalance on transaction removal", done => {
    Transaction.findOne({})
      .then(transaction => transaction.remove())
      .then(() => Budget.findOne({}))
      .then(budget => {
        budget.budgetPeriods = [
          {
            allowance: 100,
            month: moment("07-07-2017", "DD-MM-YYYY")
          },
          {
            allowance: 100,
            month: moment("06-06-2017", "DD-MM-YYYY")
          }
        ];
        return budget.save();
      })
      .then(budget => budget.balances())
      .then(balances => {
        const budgetPeriod = _.find(
          balances,
          balance =>
            moment(balance.month).format("MM-YYYY") ===
            moment(__transaction.date).format("MM-YYYY")
        );

        const followingBudgetPeriod = _.find(
          balances,
          balance =>
            moment(balance.month).format("MM-YYYY") ===
            moment(
              moment(_.cloneDeep(moment(__transaction.date))).add(1, "M")
            ).format("MM-YYYY")
        );
        expect(budgetPeriod.comulativeBalance).to.equal(100);
        expect(followingBudgetPeriod.comulativeBalance).to.equal(200);
      })
      .then(() => {
        done();
      })
      .catch(error => done(error));
  });
});
