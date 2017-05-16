

module.exports = updateTransction = (_id, transction) => {
    const mongoose = require('./../mongooseConfig');

    let Transaction = mongoose.model('Transaction');
    
    return new Promise((resolve, reject) => {
        Transaction.findOne({ _id })
            .then(transction => transction.remove())
            .then(() => transction.save())
            .then(() => resolve(transction))
            .catch(error => reject(error));
    })
};