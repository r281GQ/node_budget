const { mongoose } = require('./mongooseConfig');

const Schema = mongoose.Schema;

let UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

UserSchema.pre('remove', function(next){
  let Transaction = mongoose.model('Transaction');
  Transaction.remove({user: {$in: this}})
    .then(() => next())
    .catch((err) => {next(err);});
});

UserSchema.pre('remove', function(next){
  let Budget = mongoose.model('Budget');
  Budget.remove({user: {$in: this}})
    .then(() => next())
    .catch((err) => {next(err);});
});

UserSchema.pre('remove', function(next){
  let Account = mongoose.model('Account');
  Account.remove({user: {$in: this}})
    .then(() => next())
    .catch((err) => {next(err);});
});


UserSchema.pre('remove', function(next){
  let Grouping = mongoose.model('Grouping');
  Grouping.remove({user: {$in: this}})
    .then(() => next())
    .catch((err) => {next(err);});
});

UserSchema.pre('remove', function(next){
  let Equity = mongoose.model('Equity');
  Equity.remove({user: {$in: this}})
    .then(() => next())
    .catch((err) => {next(err);});
});

let User = mongoose.model('User', UserSchema);

module.exports = { User };
