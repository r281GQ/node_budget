const { mongoose } = require('./../../src/db/mongooseConfig');
const { Transaction } = require('./../../src/db/transaction');
const { Account } = require('./../../src/db/account')

const expect = require('expect');
const _ = require('lodash');

let transaction, accountT;

beforeEach(done => {
    Promise.all([Account.remove({}), Transaction.remove({})])
        .then(() => done())
        .catch(error => console.log(error));
});


describe('Transaction', () => {

    it('faszom', done => {
        let account = new Account({
            name: 'whatever',
            balance: 50
        });

        account.save().then(account => {
            let transaction = new Transaction({
                name: 'fffff',
                amount: 40,
                account: account._id
            });
            accountT = account;
            return transaction.save();
        }).then(transaction => {
            console.log(transaction);
            return Account.findOne({ _id: transaction.account });
        }).then(accountUpdated => {
            console.log(accountUpdated);
            let b = accountUpdated.balance;
            expect(b).toBe(33);
            console.log('passed');
            done();

        }).catch(error => done(error));
    });



    //  it('faszom1', done => {
    //     let account = new Account({
    //         name: 'whatever',
    //         balance: 500
    //     });

    //     account.save().then(account => {
    //         let transaction = new Transaction({
    //             name: 'innit',
    //             amount: 40,
    //             account: account._id
    //         });
    //         accountT = account;
    //         return transaction.save();
    //     }).then(transaction => {
    //         // console.log(transaction);
    //         return Transaction.findOneAndUpdate({ _id: transaction._id }, {$set: {name: 'cuccos'}}, {new: true});
    //     }).then(transaction => {
    //         // console.log(transaction);
    //         console.log('passed');
    //         done();

    //     }).catch(error => done(error));
    // });



});