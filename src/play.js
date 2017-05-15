
const { mongoose } = require('./db/mongooseConfig');
const { Account } = require('./db/account');
const { User } = require('./db/user');
const { Transaction } = require('./db/transaction');
const { Grouping } = require('./db/grouping');
const { Budget } = require('./db/budget');

const moment = require('moment');

const _ = require('lodash');

// Promise.all([Budget.remove({}), Account.remove({}), Transaction.remove({}), Grouping.remove({}), User.remove({}), Budget.remove({})])
//     // .then(() => {
//     //     let user = new User({
//     //         name: 'Endre',
//     //         email: 'endre@mail.com',
//     //         password: '123'
//     //     });

//     //     return user.save();
//     // })
//     .then(() => {
//         console.log('db cleared');

//         let user = new User({
//             name: 'Endre',
//             email: 'endre@mail.com',
//             password: '123'
//         });


//         return user.save();
//     })
//     .then(() => User.findOne({name: 'Endre'}))
//     .then(user => {
//         console.log(user);
//         user.name = 'newName';
//         return user.save();
//     })
//     .then(() => User.findOne({name: 'newName'}))
//     .then(user => {
//         console.log(user);
//     })
//     .catch(error => console.log(error));


// Promise.all([Budget.remove({}), Account.remove({}), Transaction.remove({}), Grouping.remove({}), User.remove({}), Budget.remove({})])
// .then(() => {
//     console.log('db cleared');

//     let user = new User({
//         name: 'Endre',
//         email: 'endre@mail.com',
//         password: '123'
//     });
//     return user.save();
// })
// .then(() => User.findOne({name: 'Endre'}))
// .then(user => {
//     console.log(user);
//     return User.findOneAndUpdate({name: 'Endre'}, {$set: {name: 'newName'}})
// })
// .then(() => User.findOne({name: 'newName'}))
// .then(user => {
//     console.log(user);
// })
// .catch(error => console.log(error));

Promise.all([Budget.remove({}), Account.remove({}), Transaction.remove({}), Grouping.remove({}), User.remove({}), Budget.remove({})])
    .then(() => {
        console.log('db cleared');

        let user = new User({
            name: 'Endre',
            email: 'endre@mail.com',
            password: '123'
        });
        return user.save();
    })
    .then(() => User.findOne({ name: 'Endre' }))
    .then(user => {

        let account = new Account({
            name: 'main',
            balance: 300
        });

        account.user = user;

        let grouping = new Grouping({
            name: 'rent',
            type: 'expense'


        });

        grouping.user = user;


        let tx = new Transaction({
            name: 'current rent',
            amount: 20
        });

        tx.user = user;
        tx.grouping = user;
        tx.account = account;

        let budget = new Budget({
            name: 'stuff',

        });

        budget.user = user;

        tx.budget = budget;

        return Promise.all([account.save(), grouping.save(), tx.save(), budget.save()]);
    })
    .then(() => Transaction.findOne({}))
    .then(tx => {
        console.log(tx);
        return Transaction.findOneAndUpdate({ name: 'current rent' }, { $unset: { budget: 'wha' } }, { new: true })
    })
    .then(tx => console.log(tx));