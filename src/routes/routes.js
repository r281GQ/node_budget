const router = require("express").Router();

const {
  handleGetAllAccounts,
  handleDeleteAccount,
  handleGetAccount,
  handlePostAccount,
  handlePutAccount
} = require("./routeHandlers/accountHandlers");

const {
  handlePostEquity,
  handleGetAllEquities,
  handleDeleteEquity,
  handleGetEquity,
  handlePutEquity
} = require('./routeHandlers/equityHandlers');

const {
  handlePostGrouping,
  handleGetAllGroupings,
  handlePutGrouping,
  handleDeleteGrouping,
  handleGetGrouping
} = require('./routeHandlers/groupingHandlers');

const {
  handlePostTransaction,
  handleGetAllTransactions,
  handlePutTransaction,
  handleDeleteTransaction,
  handleGetTransaction
} = require('./routeHandlers/transactionHandlers');

const {
  handlePostBudget,
  handleGetAllBudgets,
  handlePutBudget,
  handleDeleteBudget,
  handleGetBudget
} = require('./routeHandlers/budgetHandlers');

const { authMiddleWare } = require("./middleWares");

const ACCOUNT_BASE_URL = "account";
const GROUPING_BASE_URL = 'grouping';
const TRANSACTION_BASE_URL = 'transaction';
const BUDGET_BASE_URL = 'budget';
const EQUITY_BASE_URL = 'equity';

router.use(authMiddleWare);

router.get(`/${ACCOUNT_BASE_URL}`, handleGetAllAccounts);
router.post(`/${ACCOUNT_BASE_URL}`, handlePostAccount);
router.put(`/${ACCOUNT_BASE_URL}`, handlePutAccount);
router.delete(`/${ACCOUNT_BASE_URL}/:id`, handleDeleteAccount);
router.get(`/${ACCOUNT_BASE_URL}/:id`, handleGetAccount);

router.post(`/${GROUPING_BASE_URL}`, handlePostGrouping);
router.get(`/${GROUPING_BASE_URL}`, handleGetAllGroupings);
router.put(`/${GROUPING_BASE_URL}`, handlePutGrouping);
router.delete(`/${GROUPING_BASE_URL}/:id`, handleDeleteGrouping);
router.get(`/${GROUPING_BASE_URL}/:id`, handleGetGrouping);

router.post(`/${TRANSACTION_BASE_URL}`, handlePostTransaction);
router.get(`/${TRANSACTION_BASE_URL}`, handleGetAllTransactions);
router.put(`/${TRANSACTION_BASE_URL}`, handlePutTransaction);
router.delete(`/${TRANSACTION_BASE_URL}/:id`, handleDeleteTransaction);
router.get(`/${TRANSACTION_BASE_URL}/:id`, handleGetTransaction);

router.post(`/${BUDGET_BASE_URL}`, handlePostBudget);
router.get(`/${BUDGET_BASE_URL}`, handleGetAllBudgets);
router.put(`/${BUDGET_BASE_URL}`, handlePutBudget);
router.delete(`/${BUDGET_BASE_URL}/:id`, handleDeleteBudget);
router.get(`/${BUDGET_BASE_URL}/:id`, handleGetBudget);

router.post(`/${EQUITY_BASE_URL}`, handlePostEquity);
router.get(`/${EQUITY_BASE_URL}`, handleGetAllEquities);
router.put(`/${EQUITY_BASE_URL}`, handlePutEquity);
router.delete(`/${EQUITY_BASE_URL}/:id`, handleDeleteEquity);
router.get(`/${EQUITY_BASE_URL}/:id`, handleGetEquity);

module.exports = {
  modelRoutes: router
};
