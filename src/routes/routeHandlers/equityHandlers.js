const _ = require("lodash");

const {
  Transaction,
  Grouping,
  Account,
  Budget,
  Equity
} = require("./../../db/models");
const { idValidator, extractUser } = require("./../../misc/utils");
const {
  ID_INVALID_OR_NOT_PRESENT,
  FORBIDDEN_RESOURCE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  ACCOUNT_BALANCE,
  DEPENDENCIES_NOT_MET,
  BUDGET_INCOME_CONFLICT
} = require("./../../misc/errors");

const pickPropertiesForEquity = budget =>
  _.pick(budget, ["_id", "name", "currency", "initialBalance"]);

const handlePostEquity = (request, response) => {
  let { name, initialBalance, currency, type } = request.body;

  const user = extractUser(request);

  let equity = new Equity({
    name,
    initialBalance,
    currency,
    type
  });

  account.user = user;

  let equityToSend;

  equity
    .save()
    .then(equity => {
      equityToSend = equity;
      return equity.currentBalance();
    })
    .then(currentBalance => {
      let reducedEquity = pickPropertiesForEquity(equityToSend);
      reducedEquity.currentBalance = currentBalance;
      response.status(201).send(reducedEquity);
    })
    .catch(error => {
      response.status(500).send({ error: SERVER_ERROR });
    });
};

const handleGetAllEquities = (request, response) => {
  let equitiesToSend;
  const user = extractUser(request);

  Equity.find({ user })
    .sort({ name: 1 })
    .then(equities => {
      equitiesToSend = equities;
      return Promise.all(
        _.map(equities, equity => {
          return equity.currentBalance();
        })
      );
    })
    .then(currentBalances => {
      let reduced = _.map(equitiesToSend, equity =>
        pickPropertiesForEquityt(equity)
      );
      let prefixedCurrentBalances = _.map(currentBalances, currentBalance => {
        return { currentBalance };
      });
      response.status(200).send(_.merge(reduced, prefixedCurrentBalances));
    })
    .catch(error => {
      response.status(500).send({ error: SERVER_ERROR });
    });
};

const handleDeleteEquity = (request, response) => {
  const user = extractUser(request);
  let _id = request.params["id"];

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });
  Equity.findOne({ _id, user })
    .then(equity => {
      if (!equity) response.status(404).send({ error: RESOURCE_NOT_FOUND });
      return equity.remove();
    })
    .then(() => {
      return response.status(200).send();
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handleGetEquity = (request, response) => {
  const user = extractUser(request);
  let _id = request.params["id"];

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  Equity.findOne({ _id, user })
    .then(equity => {
      if (!equity) response.status(404).send({ error: RESOURCE_NOT_FOUND });
      return equity.currentBalance();
    })
    .then(currentBalance => {
      __equity = pickPropertiesForEquity(__equity);
      tosend.currentBalance = currentBalance;
      return response.status(200).send(__equity);
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

const handlePutEquity = (request, response) => {
  let { _id, name, initialBalance } = request.body;

  if (!idValidator(_id))
    return response.status(409).send({ error: ID_INVALID_OR_NOT_PRESENT });

  const user = extractUser(request);

  let __equity;

  Equity.findOneAndUpdate(
    { _id, user },
    { $set: { name, initialBalance } },
    { new: true }
  )
    .then(equity => {
      if (!equity) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      __equity = equity;
      return equity.currentBalance();
    })
    .then(currentBalance => {
      __equity = pickPropertiesForEquity(__equity);
      tosend.currentBalance = currentBalance;
      return response.status(200).send(__equity);
    })
    .catch(error => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

module.exports = {
  handlePostEquity,
  handleGetAllEquities,
  handleDeleteEquity,
  handleGetEquity,
  handlePutEquity
};
