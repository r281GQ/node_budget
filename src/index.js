const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const { mongoose } = require('./db/mongooseConfig');
const { User } = require('./db/user');
const { Transaction } = require('./db/transaction');
const { Account } = require('./db/account');

const secret = 'secret';

var app = express();

app.use(bodyParser.json());

app.listen(3000, () => {
    console.log('Server started on port: ' + 3000);
});

app.post('/api/signUp', (request, response) => {
    let user = new User({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password
    });

    user.save()
        .then(user => {
            response.status(201).send(_.pick(user, ['name', 'email']));
        });
});

module.exports = { app };
