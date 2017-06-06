const mongoose = require("mongoose");

const environment = process.env.NODE_ENV;

if(environment === 'test')
  mongoose.connect("mongodb://localhost:27017/test");
else if(environment === 'development')
  mongoose.connect("mongodb://localhost:27017/development");
else if(environment === "production")
  mongoose.connect("mongodb://localhost:27017/production");

mongoose.Promise = global.Promise;

module.exports = { mongoose };
