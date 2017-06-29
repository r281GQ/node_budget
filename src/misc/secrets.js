const environment = process.env.NODE_ENV;
const docs = require('./../../secret.json');

module.exports = docs[environment];
