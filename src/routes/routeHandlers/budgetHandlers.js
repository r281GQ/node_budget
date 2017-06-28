const _ = require("lodash");
const { Transaction, Grouping, Account, Budget } = require("./../../db/models");




const handlePostBudget = (request, response)=>{
  let { name, currency, defaultAllowance } = request.body;

  let userId = request.loggedInUser._id;
   let intermediate;
  let budget = new Budget({
    name,
    currency,
    defaultAllowance
  });
  budget.user = userId;

  budget.save()
    .then(bugset => {
      intermediate = bugset;
      return budget.balances();
    })
    .then(balances=> {
      let g = {};
      _.forEach(balances, bps => {

        g[bps._id] = bps;
      });
      let f = _.pick(intermediate, ['_id', 'name', 'currency', 'defaultAllowance']);
      f.budgetPeriods = g;
      response.status(201).send(f);
    })
    .catch(error => {
      response.status(500).send({error: ''});
    });

};
const handleGetAllBudgets = (request, response)=>{
  let { loggedInUser } = request;

    let intermediate;

    //merge needs an object to assicate with an onther array same object

    Budget.find({ user: loggedInUser._id })
      .then(budgets => {
        intermediate = budgets;
        return Promise.all(_.map(budgets, budget => budget.balances()));
      })
      .then(enhancedBPS => {
        // console.log(enhancedBPS);
        let enhancedBPS1 = _.map(enhancedBPS, budgetPeriods => {
          return { budgetPeriods };
        });
        // console.log(enhancedBPS1);

        let tosend = _.map(intermediate, budget => _.pick(budget, ['_id','name', 'currency', 'user', 'defaultAllowance']));
        // console.log(tosend);
        let fine = _.merge(tosend, enhancedBPS1);

        _.forEach(fine, bp => {
          let g = {};
          _.forEach(bp.budgetPeriods, bps => {

            g[bps._id] = bps;
          });
          bp.budgetPeriods = g;
          // console.log(g);
        });
        // console.log(enhancedBPS);
        // console.log(fine);
        response.status(200).send(fine);
      })
      .catch((err) => response.status(500).send({}));

};
const handlePutBudget = (request, response)=>{
  // console.log(request.body._id);
    // if (request.loggedInUser._id !== budget.user.toString())
    //   return response.sendStatus(403);
let intermediate;
    Budget.findOneAndUpdate({_id: request.body._id, user: request.loggedInUser._id, }, {$set: {name: request.body.name }  }, {new: true})
      .then(budget => {
        if(!budget)
          response.status(404).send({});
          intermediate = budget;
          return budget.balances();
      })
      .then(balances => {
        let g = {};
        _.forEach(balances, bps => {

          g[bps._id] = bps;
        });
        let f = _.pick(intermediate, ['_id', 'name', 'currency', 'defaultAllowance']);
        f.budgetPeriods = g;
        console.log(f);
        // response.status(201).send(f);
        response.status(200).send(f);
      })
      .catch(error => {
        console.log(error);
      });
};

// const handlePutBudgetPeriod = (request, response)=>{
//   // console.log(request.body._id);
//     // if (request.loggedInUser._id !== budget.user.toString())
//     //   return response.sendStatus(403);
//
//     Budget.findOneAndUpdate({_id: request.body._id, user: request.loggedInUser._id, }, {$set: {name: request.body.name }  }, {new: true})
//       .then(budget => {
//         if(!budget)
//           response.status(404).send({})
//         response.status(200).send(budget);
//       })
//       .catch(error => {
//         console.log(error);
//       });
// };
const handleDeleteBudget = (request, response)=>{
    let _id = request.params['id'];
    let loggedInUser = request.loggedInUser;

    Budget.findOne({ _id })
      .then(budget => {
          if(!budget.user.equals(loggedInUser._id))
            response.status(403).send();
          return budget.remove();
      })
      .then(() => {
        response.status(200).send();
      })
      .catch(error => {

      });
};
const handleGetBudget = (request, response)=>{
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
        console.log('balance:',  balances);

        // console.log(_.pick(budget, ["name", "budgetPeriods"]));

      return response
        .status(200)
        .send({});
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
