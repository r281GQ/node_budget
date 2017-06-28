const ID_INVALID_OR_NOT_PRESENT = 'Id is either invalid or not present.';
const FORBIDDEN_RESOURCE = `You don't have access for the requested resource.`;
const RESOURCE_NOT_FOUND = `There is no resource in the database with the associated id.`;
const SERVER_ERROR = `Internal server error.`;
const ACCOUNT_BALANCE = `On creating modifying or deleting a transaction would result in insufficient balance on one of the accounts.`;
const DEPENDENCIES_NOT_MET = 'Account and grouping must be present';
const BUDGET_INCOME_CONFLICT = 'Transaction cannot be income when a budget is attached to it.'


module.exports = { BUDGET_INCOME_CONFLICT, DEPENDENCIES_NOT_MET,ID_INVALID_OR_NOT_PRESENT, FORBIDDEN_RESOURCE, RESOURCE_NOT_FOUND, SERVER_ERROR, ACCOUNT_BALANCE };
