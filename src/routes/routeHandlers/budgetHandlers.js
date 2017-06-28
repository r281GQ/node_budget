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

  let { _id, name } = request.body;

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
      response.status(200).send(intermediate);
    })
    .catch(error => {
      console.log(error);
    });
};

const handleDeleteBudget = (request, response) => {
  let _id = request.params["id"];
  let loggedInUser = request.loggedInUser;

  Budget.findOne({ _id })
    .then(budget => {
      if (!budget.user.equals(loggedInUser._id)) response.status(403).send();
      return budget.remove();
    })
    .then(() => {
      response.status(200).send();
    })
    .catch(error => {});
};
const handleGetBudget = (request, response) => {
  let tosen;
  Budget.findOne({ _id: request.params["id"] })
    .then(budget => {
      if (request.loggedInUser._id !== budget.user.toString())
        return response.sendStatus(403);
      tosen = budget;
      console.log(budget.budgetPeriods);
      return budget.balances();
    })
    .then(balances => {
      console.log("balance:", balances);

      // console.log(_.pick(budget, ["name", "budgetPeriods"]));

      return response.status(200).send({});
    })
    .catch(() => response.sendStatus(404));
};

//   if (request.loggedInUser._id !== budget.user.toString())
//     return response.sendStatus(403);
//
//   // Budget.findOneAndUpdate({_id: request.body._id}, {$set: {name: request.body.name }  }, {new: true})
//   //   .then()
//
//
// app.put(`/api/budgetPeriod`, authMiddleWare, (request, response) => {
//   if (request.loggedInUser._id !== budget.user.toString())
//     return response.sendStatus(403);
//
//   // Budget.findOneAndUpdate({_id: request.body._id, budgetPeriods._id: request.body.budgetPeriod._id}, {$set: {name: request.body.name } }, {new: true})
//   //   .then()
// });
//

// app.delete('/api/budget/:id', authMiddleWare, (request, response)=>{
//
//   let _id = request.params['id'];
//   let loggedInUser = request.loggedInUser;
//
//   Budget.findOne({ _id })
//     .then(budget => {
//         if(!budget.user.equals(loggedInUser._id))
//           response.status(403).send();
//         return budget.remove();
//     })
//     .then(() => {
//       response.status(200).send();
//     })
//     .catch(error => {
//
//     });
// });

module.exports = {
  handlePostBudget,
  handleGetAllBudgets,
  handlePutBudget,
  handleDeleteBudget,
  handleGetBudget
};
