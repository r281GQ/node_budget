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



let User = mongoose.model('User', UserSchema);


module.exports = {User};