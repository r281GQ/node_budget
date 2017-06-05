process.env.NODE_ENV = 'test';
const { mongoose } = require('./../../src/db/mongooseConfig');
const { Account } = require('./../../src/db/account');
const { User } = require('./../../src/db/user');
const { Transaction } = require('./../../src/db/transaction');
const { Grouping, Budget, Equity } = require('./../../src/db/models');

const expect = require('expect');
const _ = require('lodash');


describe('Account', () => {

  afterEach(done => {
    Transaction.remove({})
    .then(() =>   Promise.all([
        Account.remove({}),
        Grouping.remove({}),
        Equity.remove({}),
        Budget.remove({}),
        User.remove({})
      ]))
    .then(() => done())
    .catch(error => done(error));
  });
    beforeEach(done => {
        Promise.all([Account.remove({}), User.remove({}), Transaction.remove({})])
            .then(() => {
                let user = new User({
                    name: 'Endre',
                    email: 'endre@mail.com',
                    password: '123456'
                });
                return user.save();
            })
            .then(() => {
                done();
            })
            .catch(error => done(error));
    });

    it('should persist account to DB', done => {

        User.findOne({})
            .then(user => {
                let account = new Account({
                    name: 'main',
                    balance: 100,
                    currency: 'GBP'
                });

                account.user = user;

                return account.save();
            })
            .then(account => {
                return Account.find({});
            })
            .then(accounts => {
                expect(accounts.length).toBe(1);
                done();
            })
            .catch(error => done(error));
    });

    // it('should change only the name on update operation', done => {
    //     sampleAccount = new Account({
    //         name: 'main',
    //         balance: 100,
    //         user: userId,
    //         currency: 'GBP'
    //     });

    //     sampleAccount.save()
    //         .then(account => {
    //             return Account.findOneAndUpdate({ _id: account._id }, { $set: { name: 'side' } }, { new: true });
    //         })
    //         .then(account => {
    //             expect(account.name).toBe('side');
    //             done();
    //         })
    //         .catch(error => done(error));
    // });

    it('should remove account and all transactions belongs to account', done => {


        User.findOne({})
            .then(user => {
                let sampleAccount = new Account({
                    name: 'main',
                    balance: 100,
                    currency: 'GBP'
                });

                let sampleGrouping = new Grouping({
                    name: 'flat',
                    type: 'expense'
                });

                sampleAccount.user = user;
                sampleGrouping.user = user;

                let transaction1 = new Transaction({
                    name: 'rent',
                    amount: 10,
                });

                let transaction2 = new Transaction({
                    name: 'bills',
                    amount: 15,
                });

                transaction1.user = user;
                transaction1.account = sampleAccount;
                transaction1.grouping = sampleGrouping;

                transaction2.user = user;
                transaction2.account = sampleAccount;
                transaction2.grouping = sampleGrouping;


                return Promise.all([sampleAccount.save(), sampleGrouping.save(), transaction1.save(), transaction2.save()]);
            })
            .then(()=> Account.findOne({name: 'main'}))
            .then(accoun => accoun.remove())
            .then(() => Transaction.find({}))
            .then(transactions => {
                expect(transactions.length).toBe(0);
                done();
            })
            .catch(error => done(error));


    });
});
