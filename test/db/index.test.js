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

xdescribe("endpoints", () => {
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
          name: 'budget',
          currency: 'GBP',
          defaultAllowance: 100
        });

        budget.user = user;

        return Promise.all([account.save(), grouping.save(), equity.save(), budget.save()]);
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
        transactions.user = dependencies[0];
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

  it("should get back all the transactions that belong to the user", done => {
    request(app)
      .post("/api/logIn")
      .set("Content-Type", "application/json")
      .send({
        email: "endre@mail.com",
        password: "123456"
      })
      .end((error, response) => {
        let token = response.headers["x-auth"];
        request(app)
          .get("/api/transaction")
          .set("x-auth", token)
          .set("Accept", "application/json")
          .expect(200)
          .expect(response => {
            expect(response.body[0].name).toBe("test");
          })
          .end(done);
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
            console.log(res.body);
            expect(res.body.name).toBe("rent");
          })
          .end(done);
      });
  });

  it("should create transaction on post method (account balance is enough)", done => {
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
          .post("/api/transaction")
          .set("x-auth", token)
          .set("Accept", "application/json")
          .send({
            account: accountG,
            grouping: groupingG,
            name: "created  Transaction from rest api",
            amount: 9
          })
          .expect(201)
          .expect(res => {
            console.log(res.body);
          })
          .end(done);
      });
  });

  xit("grouping/remove un", done => {
    // console.log('this is user G: ', userG);
    // User.findOne({})
    // .then(user => {
    let gr = new Grouping({
      name: "salary",
      type: "income"
    });

    gr.user = userG;
    gr
      .save()
      // .then(()=> Grouping.findOne({name: 'salary'}))
      .then(gr => {
        // console.log('GGGRR', gr);
        let t = new Transaction({
          name: "sla",
          amount: 200
        });
        t.user = userG;
        t.account = accountG;
        t.grouping = gr;
        return t.save();
      })
      .then(r => {
        // console.log('newly created', r);
        let texp = new Transaction({
          name: "cru",
          amount: 210
        });
        // console.log(accountG);
        texp.user = userG;
        texp.account = accountG;
        texp.grouping = groupingG;
        // console.log('gggggggg', groupingG);
        return texp.save();
      })
      .then(() => {
        return Account.findOne({});
      })
      .then(accoint => accoint.mainBalance())
      .then(main => {
        console.log(main);
        return Grouping.findOne({ name: "salary" });
      })
      .then(gr => gr.remove())
      .then(() => {
        done();
      })
      .catch(err => {
        console.log(err);
        done(err);
      });
  });

  it("eq/create", done => {
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
          .post("/api/equities")
          .set("x-auth", token)
          .set("Accept", "application/json")
          .send({
            name: "debt",
            type: "liability",
            currency: "GBP",
            initialBalance: 1000
          })
          .expect(201)
          .expect(res => {
            // console.log(res);
            console.log(res.body);
            expect(res.body.currentBalance).toBe(1000);
            // expect(res.body.user).toBe(transaction.user.toString());
          })
          .end(done);
      });
  });

  it("eq/put", done => {
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
          .put("/api/equities")
          .set("x-auth", token)
          .set("Accept", "application/json")
          .send({
            _id: equityG._id,
            name: "debt",
            type: "liability",
            currency: "GBP",
            initialBalance: 2000
          })
          .expect(200)
          .expect(res => {
            // console.log(res);
            console.log(res.body);
            // expect(res.body._id).toBe(transaction._id.toString());
            // expect(res.body.user).toBe(transaction.user.toString());
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
            console.log(res.body);
            // expect(res.body._id).toBe(transaction._id.toString());
            // expect(res.body.user).toBe(transaction.user.toString());
          })
          .end(done);
      });
  });

  it("transaction/create", done => {
    Transaction.findOne({})
      .then(transaction => {
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
              .post("/api/transaction")
              .set("x-auth", token)
              .set("Accept", "application/json")
              .send({
                // _id: transaction._id,
                account: transaction.account,
                grouping: transaction.grouping,
                name: "created  Transaction from rest api",
                amount: 900
              })
              .expect(409)
              .expect(res => {
                // console.log(res);
                console.log(res.body);
                // expect(res.body._id).toBe(transaction._id.toString());
                // expect(res.body.user).toBe(transaction.user.toString());
              })
              .end(done);
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it("transaction/put", done => {
    Transaction.findOne({})
      .then(transaction => {
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
              .put("/api/transaction")
              .set("x-auth", token)
              .set("Accept", "application/json")
              .send({
                _id: transaction._id,
                account: transaction.account,
                grouping: transaction.grouping,
                name: "Updated Transaction",
                amount: 90
              })
              .expect(200)
              .expect(res => {
                expect(res.body._id).toBe(transaction._id.toString());
                expect(res.body.user).toBe(transaction.user.toString());
              })
              .end(done);
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it("transaction/delete", done => {
    Transaction.findOne({})
      .then(transaction => {
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
              .delete(`/api/transaction/${transaction._id}`)
              .set("x-auth", token)
              .set("Accept", "application/json")
              // .send({
              //   _id: transaction._id,
              //   account: transaction.account,
              //   grouping: transaction.grouping,
              //   name: 'Updated Transaction',
              //   amount: 90
              // })
              .expect(200)
              .expect(res => {
                Transaction.findOne({}).then(tx =>
                  console.log("tx from db after deletion: ", tx)
                );
              })
              .end(done);
          });
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });



  const gettoken = (app, callback) => {
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
  it("createBudget", done => {
    gettoken(app, token => {
      request(app)
        .post("/api/budget")
        .set("Content-Type", "application/json")
        .set("x-auth", token)
        .send({
          name: "budg",
          currency: "GBP",
          defaultAllowance: 200
        })
        .expect(201)
        .expect(res => {
          console.log(res.body);
          expect(res.body.name).toBe("budg");
        })
        .end(done);
    });
  });

it('updateGrouping', done => {

  Grouping.findOne({})
    .then(grouping => {
      gettoken(app, token =>{
        request(app)
          .put('/api/grouping')
          .set('x-auth', token)
          .send({
            _id: grouping._id,
            name: 'udapted'
          })
          .expect(200)
          .expect(res => {
            console.log(res.body);
          })
          .end(done);
      });
    }).catch(error => console.log(error));

});

it('should delete equity', done => {
  Equity.findOne({})
    .then(equity => {
      // console.log(equity);
      gettoken(app, token =>{
        request(app)
          .delete(`/api/equities/${equity._id}`)
          .set('x-auth', token)

          .expect(200)
          .end((err, res )=> {
            console.log(res.status);
            request(app)
              .get('/api/equities')
              .set('x-auth', token)
              .expect(200)
              .expect(res =>{
                console.log(res.body);
              })
              .end(done);
          });
      });
    }).catch(error => console.log(error));

});


it('should delete grouping', done =>{

  Grouping.findOne({})
    .then(grouping => {
      gettoken(app, token =>{
        request(app)
          .delete(`/api/grouping/${grouping._id}`)
          .set('x-auth', token)

          .expect(200)
          .end((err, res )=> {
            request(app)
              .get('/api/grouping')
              .set('x-auth', token)
              .expect(res =>{
                console.log(res.body);
              })
              .end(done);
          });
      });
    }).catch(error => console.log(error));
});


it('should delete user and all items corresponding to it', done=> {

  User.findOne({})
    .then(user => {
      gettoken(app, token => {
        request(app)
          .delete(`/api/user/${user._id}`)
          .set('x-auth', token )
          .expect(200)
          .end((err, res)=> {
            request(app)
              .get('/api/budget')
              .set('x-auth', token)
              .expect(res => {
                console.log(res.body);
              })
              .end(done);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });

});

  it('should update name of the user', done => {
    User.findOne({})
      .then(user => {

        gettoken(app, token => {
          request(app)
            .put('/api/user')
            .set('x-auth', token)
            .send({
              _id: user._id,
              name: 'modifiedUserName'
            })
            .expect(200)
            .expect(res => {
              console.log(res.body);
              expect(res.body.name).toBe('modifiedUserName')

            })
            .end(done);
            // .end((err, res) => {
            //
            //   console.log(res);
            //
            // });
        });

      })
      .catch(error => console.log(error));
  });

  it('should return all the budgets', done => {
    gettoken(app, token => {
      request(app)
        .get('/api/budget')
        .set('x-auth', token)
        .expect(200)
        .expect(res => console.log(res.body))
        .end(done);
    });
  });

  it("deleteBudget ", done => {
    Budget.findOne({})
      .then(budget => {
        // console.log(budget);
        gettoken(app, token => {
          request(app)
            .delete(`/api/budget/${budget._id}`)
            .set('x-auth', token)
            .expect(200)
            .end((err,res) => {
              if(err){
                console.log(err);
                return done(err);
              }

              // console.log(res.body);
              done();
            });
            // .end(done)
            // ;
        });
      })
      .catch(error => console.log(error));
  });

  it("get back budget with bps with com and actual balance", done => {
    let budget = new Budget({
      name: "spending money",
      defaultAllowance: 100
    });

    budget.user = userG;

    budget
      .save()
      .then(budget => {
        return Transaction.findOneAndUpdate(
          {},
          { $set: { budget } },
          { new: true }
        );
      })
      .then(transaction => {
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
              .get(`/api/budget/${transaction.budget}`)
              .set("x-auth", token)
              .expect(200)
              .expect(res => {
                console.log(res.body);
              })
              .end(done);
          });
        // console.log(transaction);
        // done();
      })
      .catch(error => console.log(error));
  });

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
});
