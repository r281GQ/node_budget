const expect = require("expect");
const request = require("supertest");

const { app } = require("./../../src/index");
const {
  Transaction,
  Account,
  User,
  Equity,
  Budget,
  Grouping
} = require("./../../src/db/models");
const getToken = require('./../test_helper');

let __user, __account, __grouping, __transaction, token;

describe("Transaction handler", () => {
  afterEach(done => {
    Transaction.remove({})
      .then(() =>
        Promise.all([
          Account.remove({}),
          Grouping.remove({}),
          Equity.remove({}),
          Budget.remove({}),
          User.remove({})
        ])
      )
      .then(() => done())
      .catch(error => done(error));
  });

  beforeEach(done => {
    let user = new User({
      name: "Endre",
      email: "endre@mail.com",
      password: "123456"
    });
    user
      .save()
      .then(user => {
        __user = user;
        let account = new Account({
          name: "Main",
          initialBalance: 100,
          currency: "GBP"
        });

        account.user = __user;

        let grouping = new Grouping({
          name: "Rent",
          type: "expense"
        });

        grouping.user = __user;


        let budget = new Budget({
          name: "Spending money",
          currency: "GBP",
          defaultAllowance: 100
        });

        budget.user = __user;

        return Promise.all([
          account.save(),
          grouping.save(),
          budget.save()
        ]);
      })
      .then(() =>
        Promise.all([
          User.findOne({}),
          Account.findOne({}),
          Grouping.findOne({})
        ])
      )
      .then(dependencies => {
        let transactions = new Transaction({
          name: "test",
          amount: 50,
          currency: "GBP",
          memo: "test transaction"
        });
        __account = dependencies[1];
        __grouping = dependencies[2];
        transactions.user = __user;
        transactions.account = __account;
        transactions.grouping = __grouping;
        return transactions.save();
      })
      .then(transaction => {
        __transaction = transaction;
        done();
      })
      .catch(error => {
        console.log('ERROR - MAIN BEFORE EACH: ', error);
        done(error);
      });
  });

  beforeEach(done => {
    request(app)
      .post("/api/logIn")
      .set("Content-Type", "application/json")
      .send({
        email: "endre@mail.com",
        password: "123456"
      })
      .end((err, response) => {
         token = response.headers["x-auth"];
         done();
      });
  });
  describe('put' , ()=> {

    let income, tx2, differentAccount;

    beforeEach((done)=>{
      let grouping = new Grouping({
        name: "salary",
        type: "income"
      });

      let otherAcc = new Account({
        name: 'differentAccount',
        initialBalance: 500,
        currency: 'GBP'
      });

      otherAcc.user = __user;

      grouping.user = __user;
      otherAcc.save()
      .then((acc)=>{
        differentAccount = acc;
        return grouping.save();
      })
      .then(grouping => {
        income = grouping;
        let t = new Transaction({
          name: 'ahaeve',
          amount: 100,
          currency: 'GBP'
        });

        t.user = __user;
        t.account = __account;
        t.grouping = income;
        return t.save();
      })
      .then((tx)=>{
        tx2 = tx
        done();
      } )
      .catch(error => {});
    });


    it("get back 409 expense same, account same too low balance, income", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .send({
                _id: tx2._id,
                name: 'udapted',
                account: __account._id,
                grouping: income._id,
                amount: 1001
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);
        // })

      });
    });


    it("changin the transaction from income to expense on the same account, return 409", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(409)
              .send({
                _id: tx2._id,
                name: 'udapted',
                account: __account._id,
                grouping: __grouping._id,
                amount: 1001
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);

      });
    });


    it("changin the transaction from expense to income on the same account, return 200", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .send({
                _id: __transaction._id,
                name: 'udapted',
                account: __account._id,
                grouping: income._id,
                amount: 1001
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);

      });
    });


    it("different accounts both are  incomes, return 200", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .send({
                _id: tx2._id,
                name: 'udapted',
                account: differentAccount._id,
                grouping: income._id,
                amount: 1001
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);
      });
    });

    it("different accounts both are  incomes, return 200", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .send({
                _id: __transaction._id,
                name: 'udapted',
                account: differentAccount._id,
                grouping: __grouping._id,
                amount: 500
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);

      });
    });


    it.only("get back 409 expense same, account same too low balance income bas", done => {



      // getToken(app, token => {
        request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({

          name: 'exp',
          account: __account._id,
          grouping: __grouping._id,
          amount: 100,
          currency: 'GBP'
        })
        // .
        // expect((res) => {
        //   console.log('RESPONSE:', res.body);
        // })
        .then( response => {

           return request(app)
            .put(`/api/transaction`)
            .set("x-auth", token)
            .set("Accept", "application/json")
            // .expect(409)
            .send({
              // _id: tx2._id,
              _id: 'sfgdfssss',
              name: 'udapted',
              account: __account._id,
              grouping: income._id,
              amount: 10
            });
            // .expect( res => {
            //   console.log(res.body);
            //
            // })
            // .end((err, resp) => {
            //
            //
            //   done();
            //
            // });
        })
        .then(res => {
          expect(res.status).toBe(400);
          // expect(res.body.name).toBe('udated')
          done();
        } )
        .catch(error => {
          console.log(error);
done(error);

        } );




      // });
      //     getToken(app, token => {
      //       request(app)
      //       .post(`/api/transaction`)
      //       .set("x-auth", token)
      //       .set("Accept", "application/json")
      //       .send({
      //
      //         name: 'exp',
      //         account: __account._id,
      //         grouping: __grouping._id,
      //         amount: 100,
      //         currency: 'GBP'
      //       })
      //       .
      //       expect((res) => {
      //         console.log('RESPONSE:', res.body);
      //       })
      //       .end((err, response) => {
      //         if(err)
      //           return done(err);
      //         request(app)
      //           .put(`/api/transaction`)
      //           .set("x-auth", token)
      //           .set("Accept", "application/json")
      //           .expect(409)
      //           .send({
      //             // _id: tx2._id,
      //             _id: 3,
      //             name: 'udapted',
      //             account: __account._id,
      //             grouping: income._id,
      //             amount: 10
      //           })
      //           .expect( res => {
      //             console.log(res.body);
      //
      //           })
      //           .end((err, resp) => {
      //             if(err)
      //               done(err);
      //
      //             done();
      //
      //           });
      //       });
      //
      //
      //
      //
      // });
    });


    it("get back 409 expense same, account same too low balance expense", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(409)
              .send({
                _id: __transaction._id,
                name: 'udapted',
                account: __account._id,
                grouping: __grouping._id,
                amount: 1001
              })
              .expect(res => {
                console.log(res.body);

              })
              .end(done);

      });
    });

    it("should get back the grouping that is associated with the id", done => {
          getToken(app, token => {
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .send({
                _id: __transaction._id,
                name: 'updated',
                account: __account._id,
                grouping: __grouping._id,
                amount: 10
              })
              .expect(res => {
                console.log(res.body);
                expect(res.body.name).toBe('updated');
              })
              .end(done);

      });
    });
  });

});
