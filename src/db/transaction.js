const { mongoose } = require('./mongooseConfig');
const { currencyValidator } = require('./validators');

const moment = require('moment');

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
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    },
    requiered: true,
    default: 'GBP'
  },
  date: {
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
    requiered: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    requiered: true
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  grouping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grouping',
    requiered: true
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
      return account.mainBalance();
    })
    .then(main => {
      if (main - transaction.amount < 0)
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

      return account.mainBalance();
    })
    .then(main => {
      if (main - transaction.amount < 0)
        return next(new Error('Account balance is too low!'));
      next();
    });
});

let Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };