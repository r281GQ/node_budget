const {mongoose} = require('./mongooseConfig');

const Schema = mongoose.Schema;

let UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

UserSchema.statics.findById  = function (id, cb) {
  this.find({_id: id}, (err, user) => {
    cb(err, user);
  });
};

UserSchema.statics.findByIdExecAble  = function (id) {
  return this.find({_id: id});
};

let User = mongoose.model('User', UserSchema);

module.exports = {User};
