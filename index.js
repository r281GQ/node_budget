const express = require('express');
const bp = require('body-parser');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const {mongoose} = require('./db/mongooseConfig');
const {User} = require('./db/user');

const secret = 'secret';

var app = express();

// var PORT = process.env || 3000;

app.use(bp.json());

app.post('/auth', (req, res) => {





const saveCallback = respond => {
    return (error, document) => {
        if (error) {
            console.log('Unable to save!');
            respond.status(400).send(error);
        }

        document = _.pick(document, ['email', 'name']);

        let token = jwt.sign(document, secret);

        respond.status(201).header('x-auth', token).send(document);
    };
};


app.get('/users', (req, res) => {

    User.find({_id: '590832344c766012dc448fea'},(err, users) =>{


        res.send(users);

    });

    User.stuff();


});

app.post('/signUp', (req, res) => {

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    user.save(saveCallback(res));
});

app.listen(3000, () => {
    console.log('Server started on port: ' + 3000);
});

module.exports = {app};
