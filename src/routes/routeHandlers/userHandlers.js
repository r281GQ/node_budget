const _ = require("lodash");

const { User } = require("./../../db/models");
const { extractUser } = require("./../../misc/utils");
const { SERVER_ERROR } = require("./../../misc/errors");

const handlerDeleteUser = (request, response) => {
  const _id = extractUser(request)._id;

  User.findOne({ _id })
    .then(user => user.remove())
    .then(() => response.status(200).send())
    .catch(error => response.status(500).send({ error: SERVER_ERROR }));
};

const handlePutUser = (request, response) => {
  const _id = extractUser(request)._id;
  let { name } = request.body;

  let loggedInUser = request.loggedInUser;

  User.findOneAndUpdate({ _id }, { $set: { name } }, { new: true })
    .then(user =>
      response.status(200).send(_.pick(user, ["_id", "name", "email"]))
    )
    .catch(error => {
      response.status(500).send({ error: SERVER_ERROR });
    });
};
