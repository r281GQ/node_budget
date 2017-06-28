const _ = require("lodash");

const { mongoose } = require("./mongooseConfig");
const { currencyValidator } = require("./validators");

const Schema = mongoose.Schema;

let AccountSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  initialBalance: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    },
    required: true,
    default: "GBP"
  }
});

AccountSchema.methods.currentBalance = function() {
  let account = this;
  let Transaction = mongoose.model("Transaction");
  let Grouping = mongoose.model("Grouping");

  return new Promise((resolve, reject) => {
    Transaction.find({ account: account._id })
      .populate("grouping")
      .then(transactions => {
        let total = _.reduce(
          transactions,
          (sum, transaction) =>
            transaction.grouping.type === "income"
              ? sum + transaction.amount
              : sum - transaction.amount,
          account.initialBalance
        );
        resolve(total);
      })
      .catch(error => {
        reject(error);
      });
  });
};

AccountSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");
  Transaction.remove({ account: this._id })
    .then(() => {
      next();
    })
    .catch(error => {
      next(error);
    });
});

let Account = mongoose.model("Account", AccountSchema);

module.exports = { Account };
