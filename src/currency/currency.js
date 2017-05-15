const request = require('request');

const getRate = (from, to) => {
    return new Promise((resolve, reject) => {
        request('http://api.fixer.io/latest?base=' + from + '&symbols=' + to, (err, response, body) => {
            if (err)
                return reject(err);
            body = JSON.parse(body);

            resolve(body.rates[to]);
        });
    });
}

module.exports = { getRate };