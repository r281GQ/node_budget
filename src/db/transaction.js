const { mongoose } = require('./mongooseConfig');


const Schema = mongoose.Schema;

let TransactionSchema = new Schema({
  name: {
    type: String,
    requiered: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId

  },
  account: mongoose.Schema.Types.ObjectId
});

TransactionSchema.static.findById = function (id) {
  return this.find({ _id: id });
};

TransactionSchema.pre('save', function (next) {
  let Account = mongoose.model('Account');

  let preset = 33;

  Account.findOneAndUpdate({ _id: this.account }, { $set: { balance: preset } }, { new: true })
    .then(doc => next());
});

TransactionSchema.pre('findOneAndUpdate', function (next) {
  console.log('have been called');
  next();
});


TransactionSchema.pre('findOneAndUpdate', function (next) {
  let query = this;
  let oldTransaction;
  let oldTransactionGrouping;
  let conditions = query._conditions;
  let updates = query._update;

  let Account = mongoose.model('Account');
  let Grouping = mongoose.model('Grouping');

  Transaction.findOne(conditions).then(transaction => {
    oldTransaction = transaction;
    return Grouping.findOne({ _id: transaction.grouping });
  }).then(grouping => {

    oldTransactionGrouping = grouping;
    //account reverse
    if (oldTransactionGrouping.type === 'income') {
      return Account.findOneAndUpdate({ _id: oldTransaction.account }, { $inc: { balance: (oldTransaction.amount * -1) } }, { new: true });
    } else {
      return Account.findOneAndUpdate({ _id: oldTransaction.account }, { $inc: { balance: (oldTransaction.amount) } }, { new: true });
    }
  }).then(account => {
    next();
  }).catch(error => console.log(error));

});

let Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };
