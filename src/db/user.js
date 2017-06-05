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

// UserSchema.statics.findById = function (_id) {
//     return this.find({ _id: _id });
// };

let User = mongoose.model('User', UserSchema);

module.exports = { User };
