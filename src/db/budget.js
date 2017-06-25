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
  defaultAllowance:{
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

BudgetSchema.methods.balances = function() {
  let Transaction = mongoose.model("Transaction");
  let budget = this;
  let bps = budget.budgetPeriods;
  return new Promise((resolve, reject) => {
    Transaction.find({ budget: budget }).then(transactions => {
      let array = _.map(bps, bp =>
        _.extend({}, _.pick(bp, ['_id',"allowance", "month"]), {
          monthlyBalance:
            _.reduce(
              _.map(
                _.filter(budget.budgetPeriods, bpToFilter =>
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
                _.filter(transactions, transaction =>
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

      resolve(_.reduce(_.sortBy(array, ["month"]), calculateSum, []));
    });
  });
};

BudgetSchema.pre('save', function(next){
  let budget = this;
  let currentDate = moment();
  let monthsNumbers = [1,2,3,4,5,6,7,8,9,10,11,12];
  let arrayOfDate = _.reduce(monthsNumbers, (sum, monthnumber) => {
    let last=_.last(sum);
    if(!last){
      let init = moment();
      sum.push({month: init, allowance: this.defaultAllowance});
    }else{
      cloend = _.cloneDeep(last.month);
      let g = moment(cloend).add(1, 'M');
      sum.push({month: g, allowance: this.defaultAllowance});

    }

    return sum;
  }, [] );
// console.log('done');
  this.budgetPeriods = arrayOfDate;
  next();
});

BudgetSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");
  Transaction.update({ budget: this }, { $unset: { budget: 1 } })
    .then(() => next())
    .catch(error => next(error));
});

let Budget = mongoose.model("Budget", BudgetSchema);

module.exports = { Budget };
