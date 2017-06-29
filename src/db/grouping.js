const _ = require("lodash");

const { mongoose } = require("./mongooseConfig");
const { ACCOUNT_BALANCE } = require("./../misc/errors");

const Schema = mongoose.Schema;

let GroupingSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    validate: {
      validator: type => type === "income" || type === "expense"
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

GroupingSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");
  let Account = mongoose.model("Account");

  let grouping = this;

  let accountPromise = Account.find({ user: this.user });
  let transactionPromise = Transaction.find({
    user: this.user,
    grouping: { $ne: grouping }
  }).populate("grouping account");

  Promise.all([accountPromise, transactionPromise])
    .then(collections => {
      let accounts = collections[0];
      let transactions = collections[1];
      _.forEach(accounts, account => {
        let transactionForAccounts = _.filter(transactions, transaction =>
          transaction.account._id.equals(account._id)
        );

        let sumWithoutGrouping = _.reduce(
          transactionForAccounts,
          (sum, transaction) =>
            transaction.grouping.type === "income"
              ? sum + transaction.amount
              : sum - transaction.amount,
          account.initialBalance
        );
        if (sumWithoutGrouping < 0) {
          return next(new Error(ACCOUNT_BALANCE));
        } else {
          return next();
        }
      });
    })
    .catch(error => next(error));
});

GroupingSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");

  Transaction.remove({ grouping: this })
    .then(() => next())
    .catch(error => next(error));
});

let Grouping = mongoose.model("Grouping", GroupingSchema);

module.exports = { Grouping };
