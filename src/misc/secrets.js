const environment = process.env.NODE_ENV;


module.exports = environment.SECRET || 'secret';
