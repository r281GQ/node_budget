const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/First');

if(process.env.NODE_ENV === 'test')
    console.log('in test');
else
     console.log('faszom');

mongoose.Promise = global.Promise;

module.exports = { mongoose };