const _ = require("lodash");

const { Transaction, Grouping, Account, Budget } = require("./../../db/models");
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

const pickPropertiesForBudget = budget =>
  _.pick(budget, ["_id", "name", "currency", "defaultAllowance"]);

const handlePostBudget = (request, response) => {
  let { name, currency, defaultAllowance } = request.body;

  let userId = request.loggedInUser._id;
  let budgetToSend;

  let budget = new Budget({
    name,
    currency,
    defaultAllowance
  });
  budget.user = userId;

  budget
    .save()
    .then(budget => {
      budgetToSend = budget;
      return budget.balances();
    })
    .then(balances => {
      budgetToSend = pickPropertiesForBudget(budgetToSend);
      budgetToSend.budgetPeriods = balances;
      response.status(201).send(budgetToSend);
    })
    .catch(error => {
      response.status(500).send({ error: "" });
    });
};
const handleGetAllBudgets = (request, response) => {
  const user = extractUser(request);
  let intermediate;

  Budget.find({ user })
    .then(budgets => {
      intermediate = budgets;
      return Promise.all(_.map(budgets, budget => budget.balances()));
    })
    .then(balances => {
      let budgetsToSend = _.merge(
        _.map(intermediate, budget => pickPropertiesForBudget(budget)),
        _.map(balances, budgetPeriods => ({
          budgetPeriods
        }))
      );
      response.status(200).send(budgetsToSend);
    })
    .catch(error => response.status(500).send({ error: SERVER_ERROR }));
};
const handlePutBudget = (request, response) => {
  const user = extractUser(request);

  const { _id, name } = request.body;

  let intermediate;
  Budget.findOneAndUpdate({ _id, user }, { $set: { name } }, { new: true })
    .then(budget => {
      if (!budget) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      intermediate = budget;
      return budget.balances();
    })
    .then(balances => {
      intermediate = pickPropertiesForBudget(intermediate);
      intermediate.budgetPeriods = balances;
      return response.status(200).send(intermediate);
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

const handleDeleteBudget = (request, response) => {
  const _id = request.params["id"];
  const user = extractUser(request);

  Budget.findOne({ _id, user })
    .then(budget => {
      if (!budget) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      return budget.remove();
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

const handleGetBudget = (request, response) => {
  const _id = request.params["id"];
  const user = extractUser(request);

  let intermediate;
  
  Budget.findOne({ _id, user })
    .then(budget => {
      if (!budget) return Promise.reject({ message: RESOURCE_NOT_FOUND });
      intermediate = budget;
      return budget.balances();
    })
    .then(balances => {
      intermediate = pickPropertiesForBudget(intermediate);
      intermediate.budgetPeriods = balances;
      return response.status(200).send(intermediate);
    })
    .catch(() => {
      switch (error.message) {
        case RESOURCE_NOT_FOUND:
          return response.status(404).send({ error: RESOURCE_NOT_FOUND });
        default:
          return response.status(500).send({ error: SERVER_ERROR });
      }
    });
};

module.exports = {
  handlePostBudget,
  handleGetAllBudgets,
  handlePutBudget,
  handleDeleteBudget,
  handleGetBudget
};
