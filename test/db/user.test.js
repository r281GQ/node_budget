const { mongoose } = require("./../../src/db/mongooseConfig");
const {
  User,
  Transaction,
  Account,
  Equity,
  Budget,
  Grouping
} = require("./../../src/db/models");

const { expect } = require("chai");
const _ = require("lodash");

describe("User", () => {
  beforeEach(done => {
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
        expect(user.name).to.equal("Endre");
        done();
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
      .then(user => {
        expect(user.email).to.equal("mail");
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  it("should delete existing document", done => {
    let user = new User({
      name: "Endre",
      email: "mail",
      password: "123456"
    });

    user
      .save()
      .then(() => User.remove({ name: "Endre" }))
      .then(() => User.find({}))
      .then(users => {
        expect(users.length).to.equal(0);
        done();
      })
      .catch(error => {
        done(error);
      });
  });
});
