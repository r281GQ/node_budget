const mongoose = require('./mongooseConfig');
const _ = require('lodash');

const { currencyValidator } = require('./validators');


const Schema = mongoose.Schema;

const Equity = new Schema({
  name: {
    type: String,
    requiered: true,
  },
  type: {
    type: String,
    validate: {
      validator: type => type === 'asset' || type === 'liability'
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
  }
});

Equity.methods.getBalance = function () {
  var equity = this;
  // assume this.type = asset

  let Transaction = mongoose.model('Transaction');

  Transaction.find({equity: equity._id}).populate('grouping equity')
    .then(transactions => {
      let sum = _.reduce(transactions, (sum, transaction) => {
        if((transaction.grouping.type === income && transaction.equity.type === liability) || (transaction.grouping.type === expense && transaction.equity.type === asset))
          return sum + transaction.amount;
        else if (transaction.grouping.type === expense && transaction.equity.type === asset || transaction.grouping.type === income && transaction.equity.type === liability)
          return sum - transaction.amount;
      }, 0);
      return sum;
    })
    .catch(error => console.log(error));

};
