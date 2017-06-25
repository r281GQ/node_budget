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
      _.forEach(intermediate.budgetPeriods, bps => {

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
const handlePutBudget = ()=>'';
const handleDeleteBudget = ()=>'';
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


module.exports = {
  handlePostBudget,
  handleGetAllBudgets,
  handlePutBudget,
  handleDeleteBudget,
  handleGetBudget
};
