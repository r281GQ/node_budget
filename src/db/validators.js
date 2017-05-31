const currencyValidator = currency => {
    return currency === 'GBP' || currency === 'EUR' || currency === 'HUF' || currency === 'USD';
};

module.exports = { currencyValidator };