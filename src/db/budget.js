const { mongoose } = require('./../../src/db/mongooseConfig');

const moment = require('moment');

const _ = require('lodash');

const Schema = mongoose.Schema;

let BudgetPeriodSchema = new Schema({
    month: {
        type: Date,
    },
    allowance: Number,
});

let BudgetSchema = new Schema({
    name: String,
    currency: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    budgetPeriods: [BudgetPeriodSchema]
});

const calculateSum = (extendedBudgetPeriods, bp) => {
    let budgetPeriodFromLastIteration = _.last(extendedBudgetPeriods);

    let comulativeBalance = !budgetPeriodFromLastIteration ? 0 : budgetPeriodFromLastIteration.comulativeBalance;

    extendedBudgetPeriods.push(_.extend({}, bp, { comulativeBalance: comulativeBalance + bp.monthlyBalance }));

    return extendedBudgetPeriods;
};

BudgetSchema.methods.balances = function () {
    let Transaction = mongoose.model('Transaction');
    let budget = this;
    let bps = budget.budgetPeriods;
    return new Promise((resolve, reject) => {
        Transaction.find({ budget: budget })
            .then(transactions => {
                let array = _.map(bps, bp =>
                    _.extend({}, _.pick(bp, ['allowance', 'month']), {
                        monthlyBalance: _.reduce(_.map(_.filter(budget.budgetPeriods, bpToFilter => moment(bpToFilter.month).isSame(moment(bp.month, 'DD-MM-YYYY'), 'month')), bpToMap => bpToMap.allowance), (sum, allowance) => sum + allowance, 0) -
                        _.reduce(_.filter(transactions, transaction => moment(transaction.date).isSame(moment(bp.month, 'DD-MM-YYYY'), 'month')), (sum, transaction) => sum + transaction.amount, 0)
                    })
                );

                resolve(_.reduce(_.sortBy(array, ['month']), calculateSum, []));
            });
    });
};



BudgetSchema.pre('remove', function (next) {
    let Transaction = mongoose.model('Transaction');
    Transaction.findAndUpdate({ budget: this }, { $unset: { budget: 1 } });
});

let Budget = mongoose.model('Budget', BudgetSchema);

module.exports = { Budget };