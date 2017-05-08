const { mongoose } = require('./../../src/db/mongooseConfig');
const { User } = require('./../../src/db/user');

const expect = require('expect');
const _ = require('lodash');


const sampleUser = new User({
  name: 'Endre',
  email: 'mail',
  password: '123456'
});

beforeEach(() => {
  User.remove({})
    .then(() => console.log('db dropped'))
    .catch(error => console.log(error));
});

describe('User', () => {
  it('should be persisted to database', done => {
    let user = new User({
      name: 'Endre',
      email: 'mail',
      password: '123456'
    });

    user.save()
      .then(user => {
        console.log(user);
        User.find({}).then(users => {
          expect(users.length).toBe(1);
          done();
        })
      })
      .catch(error => {
        console.log(error);
        done(error);
      });
  });

  it('should be able to retrive from db', done => {
    let retreivedUser;
    sampleUser.save()
      .then(user => {
        retreivedUser = user;
        User.find({ _id: retreivedUser._id }).then(user => { done(); }).catch(error => { done(error); });
      })
      .catch(error => { done(); });
  });

  it('should delete existing document', () => {
    let retreivedUser;

    sampleUser.save().then(user => {
      user = retreivedUser;
      User.find({ _id: retreivedUser._id }).remove().then(document => {
        done();
      });
    }).catch(error => {
      done(error);
    });
  });

  it('should get back the docuemnt by Id', done => {
    let retreivedUser;

    sampleUser.save()
    .then(user => {
      retreivedUser = user;
      return User.findById(user._id);
    })
    .then(user => done())
    .catch(error => done(error));
  });
});
