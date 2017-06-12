const router = require("express").Router();

const {
  handleGetAllAccounts,
  handleDeleteAccount,
  handleGetAccount,
  handlePostAccount,
  handlePutAccount
} = require("./routeHandlers/accountHandlers");
const { authMiddleWare } = require("./middlewares");

router.use(authMiddleWare);

router.get("", handleGetAllAccounts);
router.post("", handlePostAccount);
router.put("", handlePutAccount);
router.delete(`/:id`, handleDeleteAccount);
router.get(`/:id`, handleGetAccount);

module.exports = {
  accountRoutes: router
};
