const { mongoose } = require('./mongooseConfig');
const { currencyValidator } = require('./validators');
const { getRate } = require('./../currency/currency');

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
  accountAmount: {
    type: Number
  },
  currency: {
    type: String,
    validate: {
      validator: currencyValidator
    }
  },
  date: {
    type: Date,
    default: moment
  },
  memo: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  grouping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grouping'
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
        return next(new Error('There is not enough balance on that account!'));

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
      console.log('main:' + main);
      console.log('amount: ' + transaction.amount);
      if (main - transaction.amount < 0)
        return next(new Error('Balance is to low to delete that income!'));
      next();
    });
});

let Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Transaction };