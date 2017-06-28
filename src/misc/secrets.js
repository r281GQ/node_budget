const environment = process.env.NODE_ENV;

module.exports = environment === 'test' ? 'secret' : 'secret';
