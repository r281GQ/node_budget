const { mongoose } = require('./mongooseConfig');

const _ = require('lodash');

const Schema = mongoose.Schema;

let GroupingSchema = new Schema({
    name: String,
    type: {
        type: String,
        required: true,
        validate: {
            validator: type => type === 'income' || type === 'expense'
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
});

GroupingSchema.pre('remove', function (next) {
    let Transaction = mongoose.model('Transaction');
    let Account = mongoose.model('Account');

    let grouping = this;

    let accountPromise = Account.find({ user: this.user });
    let transactionPromise = Transaction.find({ user: this.user, grouping: { $ne: grouping } }).populate('grouping account');

    Promise.all([accountPromise, transactionPromise])
        .then(collections => {
            let accounts = collections[0];
            let transactions = collections[1];
            _.forEach(accounts, account => {
              let transactionForAccounts = _.filter(transactions, transaction => transaction.account._id.equals(account._id));

              let sumWithoutGrouping = _.reduce(transactionForAccounts, (sum, transaction) =>
                  (transaction.grouping.type === 'income') ? sum + transaction.amount : sum - transaction.amount, account.balance);
              if (sumWithoutGrouping < 0)
                  return next(new Error('Balance would not be enought if grouping was removed!'));
            });
            return Transaction.remove({ grouping: grouping });
        })
        .then(() => next());
});

GroupingSchema.pre('remove', function (next) {
    let Transaction = mongoose.model('Transaction');

    Transaction.remove({ grouping: this })
        .then(() => next())
        .catch(error => next(error));
});

let Grouping = mongoose.model('Grouping', GroupingSchema);

module.exports = { Grouping };
