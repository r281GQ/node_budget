const mongoose = require("mongoose");

const environment = process.env.NODE_ENV;

if(environment === 'test')
  mongoose.connect("mongodb://localhost:27017/test");
else
  mongoose.connect("mongodb://localhost:27017/development");

mongoose.Promise = global.Promise;

module.exports = { mongoose };
