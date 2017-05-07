const {mongoose} = require('./mongooseConfig');

const Schema = mongoose.Schema;

let AccountSchema = new Schema({
  name: {
    type: String
  },
  balance: {
    type: Number
  }


});

let Account = mongoose.model('Account', AccountSchema);

module.exports = {Account};
