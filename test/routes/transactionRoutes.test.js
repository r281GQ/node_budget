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
const getToken = require("./../test_helper");

let __user, __account, __grouping, __transaction, token, __budget;

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

        return Promise.all([account.save(), grouping.save(), budget.save()]);
      })
      .then(() =>
        Promise.all([
          User.findOne({}),
          Account.findOne({}),
          Grouping.findOne({}),
          Budget.findOne({})
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
        __budget = dependencies[3];
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

  describe('post', ()=>{
    let income, tx2, differentAccount;

    beforeEach(done => {
      let grouping = new Grouping({
        name: "salary",
        type: "income"
      });



      grouping.user = __user;
      grouping.save()

        .then(grouping => {
          income = grouping;


          done();
        })
        .catch(error => {});
    });



    it('should pass', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __grouping._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(201);
          // expect(response.body.error).toBe(`On creating modifying or deleting a transaction would result in insufficient balance on one of the accounts.`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });

    it('test pre hooks account balance issue', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __grouping._id,
          amount: 100,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe(`On creating modifying or deleting a transaction would result in insufficient balance on one of the accounts.`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });

    it('test pre hooks account balance dep not present acc', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __grouping._id,
          grouping: __grouping._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe(`Account and grouping must be present`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });


    it('test pre hooks account balance dep not present group', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __account._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe(`Account and grouping must be present`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });

    it('test pre hooks income with budget', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: income._id,
          budget: __budget._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe(`Transaction cannot be income when a budget is attached to it.`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });

    it('test pre hooks no budget', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __grouping._id,
          budget: __account._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe(`There is no resource in the database with the associated id.`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });

    it('test pre hooks no budget', done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: 3,
          grouping: __grouping._id,
          budget: __account._id,
          amount: 1,
          currency: "GBP"
        })
        .then(response => {
          expect(response.status).toBe(409);
          expect(response.body.error).toBe(`Id is either invalid or not present.`);
          done() ;
        })
        .catch(error => {

          done(error)
        });
    });


  });
  describe("put", () => {
    let income, tx2, differentAccount;

    beforeEach(done => {
      let grouping = new Grouping({
        name: "salary",
        type: "income"
      });

      let otherAcc = new Account({
        name: "differentAccount",
        initialBalance: 500,
        currency: "GBP"
      });

      otherAcc.user = __user;

      grouping.user = __user;
      otherAcc
        .save()
        .then(acc => {
          differentAccount = acc;
          return grouping.save();
        })
        .then(grouping => {
          income = grouping;
          let t = new Transaction({
            name: "ahaeve",
            amount: 100,
            currency: "GBP"
          });

          t.user = __user;
          t.account = __account;
          t.grouping = income;
          return t.save();
        })
        .then(tx => {
          tx2 = tx;
          done();
        })
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
            name: "udapted",
            account: __account._id,
            grouping: income._id,
            amount: 1001
          })
          .expect(res => {
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
          .expect(400)
          .send({
            _id: tx2._id,
            name: "udapted",
            account: __account._id,
            grouping: __grouping._id,
            amount: 1001
          })
          .expect(res => {
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
            name: "udapted",
            account: __account._id,
            grouping: income._id,
            amount: 1001
          })
          .expect(res => {
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
            name: "udapted",
            account: differentAccount._id,
            grouping: income._id,
            amount: 1001
          })
          .expect(res => {
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
            name: "udapted",
            account: differentAccount._id,
            grouping: __grouping._id,
            amount: 500
          })
          .expect(res => {
          })
          .end(done);
      });
    });

    it('409 on delete when id cannot be parsed', done => {
      request(app)
        .delete(`/api/transaction/3`)
        // .delete(`/api/transaction/59419943cd11620ba9e6353c`)
        .set("x-auth", token)
        // .set("Accept", "application/json")
        .then(res => {
          expect(res.status).toBe(409);
          expect(res.body.error).toBe('Id is either invalid or not present.');
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    //TODO: there is no aother user yet, need implementation
    // it('403 on delete when trying to access frobidden resource', done => {
    //   request(app)
    //     .delete(`/api/transaction/3`)
    //     // .delete(`/api/transaction/59419943cd11620ba9e6353c`)
    //     .set("x-auth", token)
    //     // .set("Accept", "application/json")
    //     .then(res => {
    //       expect(res.status).toBe(409);
    //       expect(res.body.error).toBe('Id is either invalid or not present.');
    //       done();
    //     })
    //     .catch(error => {
    //       console.log(error);
    //       done(error);
    //     });
    // });

    //__second trnsaction is income on __account, where another expense is created, which was only possible because of __second_transction
    //therefore we cannot decrease the amount, otherwise the expense wouldn't have enough balance
    it("put should return  400 when changing would result in insufficient balance", done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __grouping._id,
          amount: 100,
          currency: "GBP"
        })
        .then(response => {
          return (
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .send({
                _id: tx2._id,
                name: "udapted",
                account: __account._id,
                grouping: income._id,
                amount: 10
              })
          );
        })
        .then(res => {
          expect(res.status).toBe(400);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it("put should return  409 when changing would result in insufficient balance", done => {
      request(app)
        .post(`/api/transaction`)
        .set("x-auth", token)
        .set("Accept", "application/json")
        .send({
          name: "exp",
          account: __account._id,
          grouping: __grouping._id,
          amount: 100,
          currency: "GBP"
        })
        .then(response => {
          return (
            request(app)
              .put(`/api/transaction`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .send({
                _id: tx2._id,
                name: "udapted",
                account: __account._id,
                grouping: income._id,
                amount: 10
              })
          );
        })
        .then(res => {
          expect(res.status).toBe(400);
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it("get back 409 expense same, account same too low balance expense", done => {
      getToken(app, token => {
        request(app)
          .put(`/api/transaction`)
          .set("x-auth", token)
          .set("Accept", "application/json")
          .expect(400)
          .send({
            _id: __transaction._id,
            name: "udapted",
            account: __account._id,
            grouping: __grouping._id,
            amount: 1001
          })
          .expect(res => {
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
            name: "updated",
            account: __account._id,
            grouping: __grouping._id,
            amount: 10
          })
          .expect(res => {
            expect(res.body.name).toBe("updated");
          })
          .end(done);
      });
    });
  });
});
