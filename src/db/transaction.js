const moment = require("moment");
const _ = require("lodash");

const { mongoose } = require("./mongooseConfig");
const { currencyValidator } = require("./validators");
const {
  ID_INVALID_OR_NOT_PRESENT,
  FORBIDDEN_RESOURCE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  ACCOUNT_BALANCE,
  DEPENDENCIES_NOT_MET,
  BUDGET_INCOME_CONFLICT
} = require("./../misc/errors");

const Schema = mongoose.Schema;

let TransactionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    trim: true
  },
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    },
    required: true,
    default: "GBP"
  },
  date: {
    required: true,
    type: Date,
    default: moment
  },
  memo: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Budget"
  },
  grouping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Grouping",
    required: true
  },
  equity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equity"
  }
});

TransactionSchema.pre("save", function(next) {
  let transaction = this;
  let Grouping = mongoose.model("Grouping");

  Grouping.findOne({ _id: transaction.grouping, user: transaction.user })
    .then(grouping => {
      if (!grouping) return next(new Error(DEPENDENCIES_NOT_MET));
      if (grouping.type === "income" && transaction.budget)
        return next(new Error(BUDGET_INCOME_CONFLICT));
      return next();
    })
    .catch(error => {
      next(error);
    });
});

TransactionSchema.pre("save", function(next) {
  let transaction = this;
  let Budget = mongoose.model("Budget");

  if (!transaction.budget) next();

  Budget.findOne({ _id: transaction.budget, user: transaction.user })
    .then(grouping => {
      if (!grouping) return next(new Error(RESOURCE_NOT_FOUND));
      next();
    })
    .catch(error => {
      next(error);
    });
});

TransactionSchema.pre("save", function(next) {
  let transaction = this;
  let Account = mongoose.model("Account");

  Account.findOne({ _id: transaction.account, user: transaction.user })
    .then(account => {
      if (!account) return next(new Error(DEPENDENCIES_NOT_MET));
      if (transaction.grouping.type === "income") return next();
      return account.currentBalance();
    })
    .then(currentBalance => {
      if (currentBalance - transaction.amount < 0)
        return next(new Error(ACCOUNT_BALANCE));
      next();
    })
    .catch(error => {
      next(error);
    });
});

//TODO: need different api endpoint for confirmation if tx is before budget creation data, in case user wants to avoid increase in comulative balance
// TransactionSchema.pre("save", function(next) {
//   let transaction = this;
//   let Budget = mongoose.model("Budget");
//
//   if (!transaction.budget) return next();
//
//   Budget.findOne({ _id: transaction.budget })
//     .then(budget => {
//       let has = false;
//       _.forEach(budget.budgetPeriods, bp => {
//         if (
//           moment(transaction.date).format("MM-YYYY") ===
//           moment(bp.month).format("MM-YYYY")
//         )
//           has = true;
//       });
//
//       if (has) return next();
//
//       let init = transaction.date;
//       let newBP = {
//         month: init,
//         allowance: budget.defaultAllowance
//       };
//
//       return Budget.findOneAndUpdate(
//         { _id: budget._id },
//         { $push: { budgetPeriods: newBP } }
//       );
//     })
//     .then(budget => {
//       console.log("success");
//       return next();
//     })
//     .catch(error => {
//       console.log("cenk");
//       next(error);
//     });
// });

TransactionSchema.pre("remove", function(next) {
  let transaction = this;
  let Account = mongoose.model("Account");

  Account.findOne({ _id: transaction.account })
    .then(account => {
      if (transaction.grouping.type === "expense") return next();
      return account.currentBalance();
    })
    .then(currentBalance => {
      if (currentBalance - transaction.amount < 0)
        return next(new Error(ACCOUNT_BALANCE));
      next();
    })
    .catch(error => {
      next(error);
    });
});

let Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = { Transaction };
