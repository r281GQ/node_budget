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

let userG, accountG, groupingG, equityG;

const getToken = (app, callBack) => {
  return request(app)
    .post("/api/logIn")
    .set("Content-Type", "application/json")
    .send({
      email: "endre@mail.com",
      password: "123456"
    })
    .end((err, response) => {
      let token = response.headers["x-auth"];
      callBack(token);
    });
};

describe("endpoints", () => {
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
  it("should get back the grouping that is associated with the id", done => {
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
          .get(`/api/grouping/${groupingG._id}`)
          .set("x-auth", token)
          .set("Accept", "application/json")
          .expect(res => {
            expect(res.body.name).toBe("rent");
          })
          .end(done);
      });
  });

  it("grouping/create", done => {
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
          .post("/api/grouping")
          .set("x-auth", token)
          .set("Accept", "application/json")
          .send({
            name: "salary",
            type: "income"
          })
          .expect(201)
          .expect(res => {
            // console.log(res);
            // expect(res.body._id).toBe(transaction._id.toString());
            // expect(res.body.user).toBe(transaction.user.toString());
          })
          .end(done);
      });
  });

  it('updateGrouping', done => {

    Grouping.findOne({})
      .then(grouping => {
        getToken(app, token =>{
          request(app)
            .put('/api/grouping')
            .set('x-auth', token)
            .send({
              _id: grouping._id,
              name: 'udapted'
            })
            .expect(200)
            .expect(res => {
            })
            .end(done);
        });
      }).catch(error => {
        console.log(error);
        done(error);
      } );

  });

  it('should delete grouping', done =>{

    Grouping.findOne({})
      .then(grouping => {
        getToken(app, token =>{
          request(app)
            .delete(`/api/grouping/${grouping._id}`)
            .set('x-auth', token)

            .expect(200)
            .end((err, res )=> {
              request(app)
                .get('/api/grouping')
                .set('x-auth', token)
                .expect(res =>{
                })
                .end(done);
            });
        });
      }).catch(error => console.log(error));
  });

});
