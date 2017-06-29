const mongoose = require("mongoose");

const environment = process.env.NODE_ENV;

if (environment === "TEST") mongoose.connect("mongodb://localhost:27017/test");
else if (environment === "DEVELOPMENT")
  mongoose.connect("mongodb://localhost:27017/development");
else if (environment === "PRODUCTION" || environment === 'production')
  mongoose.connect(environment.MONGODB_URI);

mongoose.Promise = global.Promise;

module.exports = { mongoose };
