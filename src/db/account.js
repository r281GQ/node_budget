const { mongoose } = require("./mongooseConfig");
const _ = require("lodash");

const Schema = mongoose.Schema;

let AccountSchema = new Schema({
  name: {
    type: String
  },
  balance: {
    type: Number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  currency: {
    type: String
  }
});

AccountSchema.methods.currentBalance = function() {
  let account = this;
  let Transaction = mongoose.model("Transaction");
  let Grouping = mongoose.model("Grouping");

  // console.log('IIIIDDD',account._id, account.balance);

  // return new Promise((resolve, reject) => {
  //   Transaction.find({ account: account })
  //     .populate("grouping")
  //     .then(transactions => {
  //       // if(transactions.length === 0)
  //       // return resolve(account.balance);
  //       console.log('inside mainbalance: ',transactions);
  //       let total = _.reduce(
  //         transactions,
  //         (sum, transaction) => {
  //           // console.log(sum, transaction);
  //           return transaction.grouping.type === "income"
  //             ? sum + transaction.amount
  //             : sum - transaction.amount;
  //         }
  //           ,
  //         account.balance
  //       );
  //       // console.log(total);
  //       resolve(total);
  //     })
  //     .catch(error => {console.log(error);reject(error);} );
  // });

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
          account.balance
        );
        // console.log(total);
        resolve(total);
      })
      .catch(error => reject(error));
  });
};

AccountSchema.pre("remove", function(next) {
  let Transaction = mongoose.model("Transaction");
  Transaction.remove({ account: this._id }).then(() => next());
});

let Account = mongoose.model("Account", AccountSchema);

module.exports = { Account };
