const moment = require("moment");
const _ = require("lodash");

const { mongoose } = require("./../../src/db/mongooseConfig");
const { currencyValidator } = require("./../../src/db/validators");

const Schema = mongoose.Schema;

let BudgetPeriodSchema = new Schema({
  month: {
    type: Date,
    required: true
  },
  allowance: {
    type: Number,
    required: true
  }
});

let BudgetSchema = new Schema({
  defaultAllowance: {
    type: Number,
    required: true
  },
  name: {
    required: true,
    type: String
  },
  currency: {
    type: String,
    required: true,
    default: "GBP",
    validate: {
      validator: currencyValidator
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  budgetPeriods: [BudgetPeriodSchema]
});

const calculateSum = (extendedBudgetPeriods, bp) => {
  let budgetPeriodFromLastIteration = _.last(extendedBudgetPeriods);

  let comulativeBalance = !budgetPeriodFromLastIteration
    ? 0
    : budgetPeriodFromLastIteration.comulativeBalance;

  extendedBudgetPeriods.push(
    _.extend({}, bp, {
      comulativeBalance: comulativeBalance + bp.monthlyBalance
    })
  );

  return extendedBudgetPeriods;
};

BudgetSchema.methods.createInitialBudgetPeriods = function(startingMonth) {
  return new Promise((resolve, reject) => {
    let now = moment().valueOf();
    let monthsToCreate = [];

    if (startingMonth)
      while (!moment(startingMonth).isSame(now, "month")) {
        monthsToCreate.push(startingMonth);
        startingMonth = moment(startingMonth).add(1, "M");
      }

    monthsToCreate.push(now);
    let budgetPeriods = _.map(monthsToCreate, month => ({
      month,
      allowance: this.defaultAllowance
    }));

    this.budgetPeriods = budgetPeriods;
    this.save().then(budget => resolve(budget)).catch(error => reject(error));
  });
};

BudgetSchema.methods.assignBudgetPeriod = function(month) {
  return new Promise((resolve, reject) => {
    if (!month) reject();

    let firstPeriod = _.first(_.sortBy(this.budgetPeriods, ["month"]));

    if (
      !_.find(this.budgetPeriods, bp =>
        moment(bp.month).isSame(moment(month), "M")
      )
    ) {
      while (!moment(month).isSame(firstPeriod.month, "month")) {
        this.budgetPeriods.push({ month, allowance: this.defaultAllowance });
        month = moment(month).add(1, "M");
      }
      this.save().then(budget => resolve(budget)).catch(error => reject(error));
    } else {
      resolve(this);
    }
  });
};

BudgetSchema.methods.balances = function() {
  let Transaction = mongoose.model("Transaction");
  let budget = this;
  let bps = budget.budgetPeriods;
  return new Promise((resolve, reject) => {
    Transaction.find({ budget })
      .then(transactions => {
        let array = _.map(bps, bp =>
          _.extend({}, _.pick(bp, ["_id", "allowance", "month"]), {
            monthlyBalance:
              _.reduce(
                _.map(
                  _.filter(
                    budget.budgetPeriods,
                    bpToFilter =>
                      moment(bpToFilter.month).isSame(
                        moment(bp.month, "DD-MM-YYYY"),
                        "month"
                      )
                  ),
                  bpToMap => bpToMap.allowance
                ),
                (sum, allowance) => sum + allowance,
                0
              ) -
                _.reduce(
                  _.filter(
                    transactions,
                    transaction =>
                      moment(transaction.date).isSame(
                        moment(bp.month, "DD-MM-YYYY"),
                        "month"
                      )
                  ),
                  (sum, transaction) => sum + transaction.amount,
                  0
                )
          })
        );
        let calculatedArray = _.reduce(
          _.sortBy(array, ["month"]),
          calculateSum,
          []
        );
        resolve(_.keyBy(calculatedArray, "_id"));
      })
      .catch(error => {
        reject(error);
      });
  });
};

BudgetSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");
  Transaction.update({ budget: this }, { $unset: { budget: 1 } })
    .then(() => next())
    .catch(error => next(error));
});

let Budget = mongoose.model("Budget", BudgetSchema);

module.exports = { Budget };
