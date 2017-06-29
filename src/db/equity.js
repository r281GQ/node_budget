const _ = require("lodash");

const { mongoose } = require("./mongooseConfig");
const { currencyValidator } = require("./validators");

const Schema = mongoose.Schema;

let EquitySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    validate: {
      validator: type => type === "asset" || type === "liability"
    },
    required: true
  },
  initialBalance: {
    required: true,
    type: Number
  },
  currency: {
    required: true,
    type: String,
    default: "GBP",
    validate: {
      validator: currencyValidator
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

EquitySchema.methods.currentBalance = function() {
  var equity = this;

  let Transaction = mongoose.model("Transaction");
  return new Promise((resolve, reject) => {
    Transaction.find({ equity: equity._id })
      .populate("grouping equity")
      .then(transactions => {
        let sum = _.reduce(
          transactions,
          (sum, transaction) => {
            if (
              (transaction.grouping.type === "income" &&
                transaction.equity.type === "liability") ||
              (transaction.grouping.type === "expense" &&
                transaction.equity.type === "asset")
            )
              return sum + transaction.amount;
            else if (
              (transaction.grouping.type === "expense" &&
                transaction.equity.type === "liability") ||
              (transaction.grouping.type === "income" &&
                transaction.equity.type === "asset")
            )
              return sum - transaction.amount;
          },
          0
        );
        resolve(equity.initialBalance + sum);
      })
      .catch(error => console.log(error));
  });
};

EquitySchema.pre("remove", function(next) {
  let equity = this;

  let Transaction = mongoose.model("Transaction");

  Transaction.update({ equity }, { $unset: { equity: 1 } })
    .then(() => next())
    .catch(error => next(error));
});

const Equity = mongoose.model("Equity", EquitySchema);

module.exports = { Equity };
