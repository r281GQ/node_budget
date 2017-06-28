const request = require('request');

//TODO: needs an option flag in the endpoints where it can be specified whos responsibilty (client or server) will be fetching the currencies
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
