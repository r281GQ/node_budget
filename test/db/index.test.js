const expect = require("expect");
const request = require("supertest");

// const assert_request = require('assert-request');



const { app } = require("./../../src/index");

// const request = assert_request(app.listen());
const {
  Transaction,
  Account,
  User,
  Equity,
  Budget,
  Grouping
} = require("./../../src/db/models");

let token;

let tran;

describe("endpoints", () => {



  beforeEach(done => {
    // Promise.all([
      // Transaction.remove({})
    //   Account.remove({}),
    //
    //   Grouping.remove({}),
    //
    //   Equity.remove({}),
    //   User.remove({})
    // ])




      // .then(() => {
          let sampleUser = new User({
            name: "Endre",
            email: "endre@mail.com",
            password: "123456"
          });
           sampleUser.save()

          .then(() => User.findOne({ name: "Endre" }))
          .then(user => {
            let account = new Account({
              name: "main",
              balance: 100,
              currency: "GBP"
            });
            account.user = user;

            let grouping = new Grouping({
              name: "rent",
              type: "expense"
            });

            grouping.user = user;

            let equity = new Equity({
              name: "betting",
              initialBalance: 1000,
              type: "asset",
              currency: "GBP"
            });

            equity.user = user;

            // let tx = new Transaction({
            //   name: "test",
            //   amount: 50,
            //   currency: "GBP",
            //   memo: "test porpuses"
            // });
            //
            // tx.user = user;
            // tx.account = account;
            // tx.equity = equity;
            // tx.grouping = grouping;



            return Promise.all([

              account.save(),
              grouping.save(),
              equity.save(),
// tx.save()
            ]);
          })
      // })
      .then(() => Promise.all([User.findOne({}), Account.findOne({}), Grouping.findOne({})]))
      .then(stuffs => {
        // console.log(stuffs);
        let tx = new Transaction({
          name: "test",
          amount: 50,
          currency: "GBP",
          memo: "test porpuses"
        });
        tx.user = stuffs[0];
        tx.account = stuffs[1];
        // tx.equity = equity;
        tx.grouping = stuffs[2];
        return tx.save();
      })
      // .then(() => {
      //
      //   return Transaction.find({});
      // })
      // .then(tx => console.log('transacion is: ' , tx))
      .then(() => done())
      .catch(error => {console.log('error happened', error);});
  });

  it.only("account/get", (done) => {

    // token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRW5kcmUiLCJlbWFpbCI6ImVuZHJlQG1haWwuY29tIiwiX2lkIjoiNTkzM2E2YzQwMjAzMDAwZTZmZDNmZTA0IiwiaWF0IjoxNDk2NTU3NTE4fQ.pAVnZo5A0tt4vz4Qa1r8OdF5WXo9MsYtcbEyG0SLslc';

    // return request.get('/api/transaction')
    //   .type('application/json')
    //   .status(200)
    //
    //   .okay();

    request(app)
      .post('/api/logIn')
      .set('Content-Type', 'application/json')
      .send({
        email: 'endre@mail.com',
        password: '123456'
      })
      .end((err, response) => {
        let token = response.headers['x-auth'];
        request(app)
          .get('/api/transaction')
          .set('x-auth', token)
          .set('Accept', 'application/json')

          .expect(200)
          .expect(res => {
            console.log(res.body);
            expect(res.body[0].name).toBe('test');
            expect(res.body.length).toBe(1);
          })
          .end(done);
      });

    // request(app)
    //   .get('/api/transaction')
    //   // .set('x-auth', token)
    //   .set('Accept', 'application/json')
    //
    //   .expect(200)
    //   .expect(res => {
    //     console.log(res.body);
    //     expect(res.body[0].name).toBe('test');
    //     expect(res.body.length).toBe(1);
    //   })
    //   .end(done);

  });

    // request(app)
    //   .post('/api/logIn')
    //   .set('Content-Type', 'application/json')
    //   .send({
    //     email: 'endre@mail.com',
    //     password: '123456'
    //   })
    //   .end((err, response) => {
    //     token = response.headers['x-auth'];
    //     console.log(token);
    //     request(app)
    //       .get('/api/transaction')
    //       .set('x-auth', token)
    //
    //       .expect(200)
    //       .end((err, res) => {
    //         if( err )
    //           console.log(err);
    //
    //         console.log(res);
    //         done();
    //       });
    //   });

    afterEach(done => {

      Transaction.remove({})
      .then(() =>   Promise.all([
          Account.remove({}),

          Grouping.remove({}),

          Equity.remove({}),
          User.remove({})
        ]))




      .then(() => done())
      .catch(error => done(error));






    });

  });
