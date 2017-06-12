const moment = require('moment');

const { mongoose } = require('./mongooseConfig');
const { currencyValidator } = require('./validators');

const Schema = mongoose.Schema;

let TransactionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    },
    required: true,
    default: 'GBP'
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
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  grouping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grouping',
    required: true
  },
  equity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equity'
  }
});

TransactionSchema.pre('save', function (next) {
  let transaction = this;
  let Account = mongoose.model('Account');

  Account.findOne({ _id: transaction.account })
    .then(account => {
      if (transaction.grouping.type === 'income')
        return next();
      return account.currentBalance();
    })
    .then(currentBalance => {
      if (currentBalance - transaction.amount < 0)
        return next(new Error('Account balance is too low!'));
      next();
    });
});

TransactionSchema.pre('remove', function (next) {
  let transaction = this;
  let Account = mongoose.model('Account');

  Account.findOne({ _id: transaction.account })
    .then(account => {
      if (transaction.grouping.type === 'expense')
        return next();
      return account.currentBalance();
    })
    .then(currentBalance => {
      if (currentBalance - transaction.amount < 0)
        return next(new Error('Account balance is too low!'));
      next();
    })
    .catch(error => {
      console.log('AINT IN HERE');
      next(error);
    });
});

let Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };
