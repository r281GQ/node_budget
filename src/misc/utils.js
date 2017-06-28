const idValidator = _id => (_id ? /^[0-9a-fA-F]{24}$/.test(_id) : false);
const extractUser = request => request.loggedInUser._id;

module.exports = { idValidator, extractUser };
