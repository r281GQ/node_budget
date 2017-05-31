const { mongoose } = require('./../../src/db/mongooseConfig');

const { Transaction } = require('./../../src/db/transaction');
const { Account } = require('./../../src/db/account');
const { Grouping } = require('./../../src/db/grouping');
const { User } = require('./../../src/db/user');
const { Budget } = require('./../../src/db/budget');

const expect = require('expect');
const moment = require('moment');
const _ = require('lodash');



describe('Budget', () => {
    beforeEach(done => {
        Promise.all([Budget.remove({}), Account.remove({}), Transaction.remove({}), Grouping.remove({}), User.remove({})])
            .then(() => {
                let user = new User({
                    name: 'Endre',
                    email: 'endre@mail.com',
                    password: '123'
                });

                return user.save();
            })
            .then(() => done())
            .catch(error => done(error));
    });


    it('', done => {
        // let x = Date.parse('10-12-2017').toISOString();
        // console.log(x);
        User.findOne({ name: 'Endre' })
            .then(user => {

                let account = new Account({
                    name: 'main',
                    balance: 5
                });

                let budget = new Budget({
                    name: 'spending money',
                    budgetPeriods: [{ month: moment('20-11-2016', 'DD-MM-YYYY'), allowance: 100 }]
                });

                budget.user = user;

                account.user = user;

                let grouping = new Grouping({
                    name: 'salary',
                    type: 'income'
                });

                grouping.user = user;

                let transaction = new Transaction({
                    name: 'current rent',
                    amount: 10,
                    currency: 'GBP'
                });

                transaction.account = account;
                transaction.grouping = grouping;
                transaction.user = user;
                transaction.budget = user;

                return Promise.all([budget.save(), account.save(), grouping.save(), transaction.save()])
            })
            .then(() => {
                return Budget.findOne({});
            })
            .then((budget) => {

                console.log(budget.budgetPeriods[0]);

                let result = moment(budget.budgetPeriods[0].month).isSame(moment('11-2016', 'MM-YYYY'), 'month');

                expect(result).toBe(true);

                done();
            })
            .catch(error => done(error));
    });

    it('1', done => {
        // let x = Date.parse('10-12-2017').toISOString();
        // console.log(x);
        User.findOne({ name: 'Endre' })
            .then(user => {

                let account = new Account({
                    name: 'main',
                    balance: 50
                });

                let budget = new Budget({
                    name: 'spending money',
                    budgetPeriods: [
                        { month: moment('02-05-2017', 'DD-MM-YYYY'), allowance: 100 },
                        { month: moment('02-04-2017', 'DD-MM-YYYY'), allowance: 40 }
                    ]
                });

                budget.user = user;

                account.user = user;

                let grouping = new Grouping({
                    name: 'salary',
                    type: 'expense'
                });

                grouping.user = user;

                let transaction = new Transaction({
                    name: 'current rent',
                    amount: 10,
                    currency: 'GBP'
                });

                let transaction2 = new Transaction({
                    name: 'current rent',
                    amount:15,
                    currency: 'GBP'
                });

                let transaction3 = new Transaction({
                    name: 'current rent',
                    amount:20,
                    currency: 'GBP',
                    date: moment('04-04-2017', 'DD-MM-YYYY')
                });

                transaction.account = account;
                transaction.grouping = grouping;
                transaction.user = user;
                transaction.budget = budget;

                transaction2.account = account;
                transaction2.grouping = grouping;
                transaction2.user = user;
                transaction2.budget = budget;

                transaction3.account = account;
                transaction3.grouping = grouping;
                transaction3.user = user;
                transaction3.budget = budget;

                return Promise.all([budget.save(), account.save(), grouping.save(), transaction.save(), transaction2.save(), transaction3.save()])
            })
            .then(() => {
                return Budget.findOne({});
            })
            .then((budget) => {


                let result = moment(budget.budgetPeriods[0].month).isSame(moment('05-2017', 'MM-YYYY'), 'month');

                expect(result).toBe(true);

                // budget.balances();

                return budget.balances();


            }).then(stuff => {
                console.log(stuff);
                done();
            }
            )
            .catch(error => done(error));
    });
});

