const { mongoose } = require("./../../src/db/mongooseConfig");
const { User, Transaction, Account, Equity, Budget, Grouping } = require("./../../src/db/models");

const expect = require("expect");
const _ = require("lodash");

describe("User", () => {
  beforeEach(done => {
    User.remove({}).then(() => done()).catch(error => console.log(error));
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

  it("should be persisted to database", done => {
    let user = new User({
      name: "Endre",
      email: "mail",
      password: "123456"
    });

    user
      .save()
      .then(user => {
        console.log(user);
        User.find({}).then(users => {
          expect(users.length).toBe(1);
          done();
        });
      })
      .catch(error => {
        done(error);
      });
  });

  it("should be able to retrieve from db", done => {
    let user = new User({
      name: "Endre",
      email: "mail",
      password: "123456"
    });
    user
      .save()
      .then(() => {
        return User.findOne({ name: "Endre" });
      })
      .then(user => {
        expect(user.email).toBe("mail");
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it("should delete existing document", () => {
    let user = new User({
      name: "Endre",
      email: "mail",
      password: "123456"
    });
    user
      .save()
      .then(() => {
        return User.remove({ name: "Endre" });
      })
      .then(() => User.find({}))
      .then(users => {
        expect(users.length).toBe(0);
        done();
      })
      .catch(error => {
        done(error);
      });
  });
});
