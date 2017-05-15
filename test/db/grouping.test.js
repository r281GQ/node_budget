const { mongoose } = require('./../../src/db/mongooseConfig');
const { Account } = require('./../../src/db/account');
const { User } = require('./../../src/db/user');
const { Transaction } = require('./../../src/db/transaction');
const { Grouping } = require('./../../src/db/grouping');

const expect = require('expect');
const _ = require('lodash');

describe('Grouping', () => {
    beforeEach(done => {
        Promise.all([Account.remove({}), User.remove({}), Grouping.remove({}), Transaction.remove({})])
            .then(() => {
                sampleUser = new User({
                    name: 'Endre',
                    email: 'endre@mail.com',
                    password: '123456'
                });
                return sampleUser.save();
            }).then(() => done())
            .catch(error => done(error));
    });
    it('should be persisted to the database with the associated resources', done => {
        User.findOne({ name: 'Endre' })
            .then(user => {

                let grouping = new Grouping({
                    name: 'spending',
                    type: 'expense'
                });
                let transaction = new Transaction({
                    name: 'rent',
                    amount: 50
                });

                let account = new Account({
                    name: 'main',
                    balance: 100
                });

                account.user = user;

                transaction.grouping = grouping;

                transaction.account = account;

                transaction.user = user;

                return Promise.all([account.save(), grouping.save(), transaction.save()]);
            })
            .then(() => Transaction.findOne({ name: 'rent' }).populate('user grouping'))
            .then(transaction => {
                expect(transaction.grouping.name).toBe('spending');
                expect(transaction.user.name).toBe('Endre');
                done();
            })
            .catch(error => done(error));
    });

    it.only('should remove grouping and all transactions belongs to grouping', done => {

        User.findOne({ name: 'Endre' }).then(user => {
            let sampleAccount = new Account({
                name: 'main',
                balance: 100,
                currency: 'GBP'
            });
            sampleAccount.user = user;

            let sampleGrouping = new Grouping({
                name: 'flat',
                type: 'expense'
            });

            let transaction1 = new Transaction({
                name: 'rent',
                amount: 10,

            });

            let transaction2 = new Transaction({
                name: 'bills',
                amount: 15,

            });

            transaction1.user = user;
            transaction2.user = user;
            transaction1.grouping = sampleGrouping;
            transaction2.grouping = sampleGrouping;

            transaction1.account = sampleAccount;
            transaction2.account = sampleAccount;
            let groupingId;

            return Promise.all([sampleAccount.save(), sampleGrouping.save(), transaction1.save(), transaction2.save()]);
        })



            .then(() => {
                return Grouping.findOne({ name: 'flat' });
            })
            .then(grouping => {
                return grouping.remove();
            })






            .then(() => {
                return Promise.all([Account.find({}), Transaction.find({})]);
            })
            .then(values => {

                return values[0][0].mainBalance();

            }).then(v => {
                expect(v).toBe(100);
                done();
            })
            .catch(error => done(error));
    });
});