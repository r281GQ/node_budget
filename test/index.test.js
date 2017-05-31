const expect = require('expect');
const request = require('supertest');

const {app} = require ('./../src/index');

const {User} = require ('./../src/db/user');
const {Transaction} = require('./../src/db/transaction');

describe('sample', ()=> {
    it('should pass' ,()=> {
        expect(2).toBe(2);
    });
});
