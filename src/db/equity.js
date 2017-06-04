const { mongoose } = require("./mongooseConfig");
const _ = require("lodash");

const { currencyValidator } = require("./validators");

const Schema = mongoose.Schema;

let EquitySchema = new Schema({
  name: {
    type: String,
    requiered: true
  },
  type: {
    type: String,
    validate: {
      validator: type => type === "asset" || type === "liability"
    }
  },
  initialBalance: {
    type: Number,
    requiered: true,
    default: 0
  },
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

EquitySchema.methods.bal = function() {
  var equity = this;
  // assume this.type = asset

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
const Equity = mongoose.model("Equity", EquitySchema);
module.exports = { Equity };
