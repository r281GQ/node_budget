const express = require('express');
const bp = require('body-parser');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const {mongoose} = require('./db/mongooseConfig');
const {User} = require('./db/user');
const {Transaction} = require('./db/transaction');
const {Account} = require('./db/account');

const secret = 'secret';

var app = express();

app.use(bp.json());

app.listen(3000, () => {
    console.log('Server started on port: ' + 3000);
});

module.exports = {app};
