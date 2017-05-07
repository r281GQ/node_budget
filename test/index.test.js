const expect = require('expect');
const request = require('supertest');

const {app} = require ('./../index');
const {User} = require ('./../db/user');
const {Transaction} = require('./../db/transaction');

describe('', ()=> {
    it('hould pass' ,()=> {
        expect(2).toBe(2);
    });
});
