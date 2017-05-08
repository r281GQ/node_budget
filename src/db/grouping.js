const {mongoose} = require('./mongooseConfig');

const Schema = mongoose.Schema;

let GroupingSchema = new Schema({
    name: String,
    type: String
});

let Grouping = mongoose.model('Grouping', GroupingSchema);

module.exports = {Grouping};