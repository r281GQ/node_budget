const expect = require("expect");
const request = require("supertest");
const hash = require('password-hash');

const password = hash.generate('123456', {algorithm:'sha256',saltLength: 8,iterations: 4});
const { app } = require("./../../src/index");

const {
  Transaction,
  Account,
  User,
  Equity,
  Budget,
  Grouping
} = require("./../../src/db/models");

let userG, accountG, groupingG, equityG;

const getToken = (app, callback) => {
  return request(app)
    .post("/api/logIn")
    .set("Content-Type", "application/json")
    .send({
      email: "endre@mail.com",
      password: "123456"
    })
    .end((err, response) => {
      let token = response.headers["x-auth"];
      callback(token);
    });
};

describe("Account handler", () => {
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
      password
    });
    user
      .save()
      .then(user => {
        userG = user;
        let account = new Account({
          name: "main",
          initialBalance: 100,
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

        let budget = new Budget({
          name: "budget",
          currency: "GBP",
          defaultAllowance: 100
        });

        budget.user = user;

        return Promise.all([
          account.save(),
          grouping.save(),
          equity.save(),
          budget.save()
        ]);
      })
      .then(() =>
        Promise.all([
          User.findOne({}),
          Account.findOne({}),
          Grouping.findOne({}),
          Equity.findOne({})
        ])
      )
      .then(dependencies => {
        let transactions = new Transaction({
          name: "test",
          amount: 50,
          currency: "GBP",
          memo: "test transaction"
        });
        transactions.user = userG;

        transactions.account = dependencies[1];
        transactions.grouping = dependencies[2];
        accountG = dependencies[1];
        groupingG = dependencies[2];
        equityG = dependencies[3];
        return transactions.save();
      })
      .then(() => {
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it("account/delete", done => {
    Account.findOne({})
      .then(account => {
        request(app)
          .post("/api/logIn")
          .set("Content-Type", "application/json")
          .expect(200)
          .send({
            email: "endre@mail.com",
            password: "123456"
          })
          .end((err, response) => {
            let token = response.headers["x-auth"];
            // console.log(response);
            request(app)
              .delete(`/api/account/${account._id}`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .end((err, res) => {
                Account.find({}).then(account => {
                  expect(account.length).toBe(0);
                  done();
                });
              });
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it("account/get", done => {
    Account.findOne({})
      .then(account => {
        request(app)
          .post("/api/logIn")
          .set("Content-Type", "application/json")
          .send({
            email: "endre@mail.com",
            password: "123456"
          })
          .end((err, response) => {
            let token = response.headers["x-auth"];
            request(app)
              .get(`/api/account/${account._id}`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .expect(200)
              .expect(res => {
                expect(res.body.name).toBe("main");
              })
              .end(done);
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it("account/put", done => {
    Account.findOne({})
      .then(account => {
        request(app)
          .post("/api/logIn")
          .set("Content-Type", "application/json")
          .send({
            email: "endre@mail.com",
            password: "123456"
          })
          .end((err, response) => {
            let token = response.headers["x-auth"];
            request(app)
              .put(`/api/account`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              .send({
                _id: account._id,
                name: "side"
              })
              .expect(200)
              .expect(res => {
                expect(res.body.name).toBe("side");
              })
              .end(done);
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it("account/create", done => {
    request(app)
      .post("/api/logIn")
      .set("Content-Type", "application/json")
      .send({
        email: "endre@mail.com",
        password: "123456"
      })
      .end((err, response) => {
        let token = response.headers["x-auth"];
        request(app)
          .post(`/api/account`)
          .set("x-auth", token)
          .set("Accept", "application/json")
          .send({
            name: "new Account",
            initialBalance: 300
          })
          .expect(201)
          .expect(res => {
            expect(res.body.name).toBe("new Account");
          })
          .end(done);
      });
  });
});
