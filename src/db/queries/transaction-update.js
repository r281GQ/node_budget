const updateTransction = (_id, transction) => {
    return new Promise((resolve, reject) => {
        Transaction.findOne({ _id })
            .then(transction => transction.remove())
            .then(() => transction.save())
            .then(() => resolve(transction))
            .catch(error => reject(error));
    })
};