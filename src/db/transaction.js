const {mongoose} = require('./mongooseConfig');

const {Account} = require('./account');

const Schema = mongoose.Schema;

let TransactionSchema = new Schema({
  name: {
    type: String,
    requiered: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

TransactionSchema.static.findById  = function (id) {
  // let that = this;
  return this.find({_id: id});
};

TransactionSchema.methods.saveAndUpdateDependencies = function (cb) {
  let transaction = this;

  console.log(transaction);

  Account.find({_id: '590edebfb66eb20ba89c80e0'}).exec((err, account) => {

    account.saveAndUpdate({balance: 35}).exec((err, acc)=> {

      if(err)
        console.log(err);
      cb(err, account);
    });


  });
}

let Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = {Transaction};
