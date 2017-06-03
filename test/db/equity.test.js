const { equity } = require('./../../src/db/equity');

const mongoose = require('./../../src/db/mongooseConfig');

const _ = require('lodash');

describe('equity', () => {

const sampleUser;

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

  it('', done => {
    let account = new Account({
      name: 'main',
      balance: 100,
      currency: 'GBP'
    });
    account.user = sampleUser;

    let grouping = new Grouping({
      name: 'rent',
      tpye: 'expense'
    });

    grouping.user = sampleUser;

    let equity = new Equity({
      name: 'betting',
      initialBalance: 1000,
      type: 'asset',
      currency: 'GBP'
    });

    equity.user = sampleUser;
  });

});
