const _ = require("lodash");
const { Grouping } = require("./../../db/models");

const handlePostGrouping = (request, response) => {
  let { name, type } = request.body;

  let grouping = new Grouping({
    name,
    type
  });

  grouping.user = request.loggedInUser._id;

  grouping
    .save()
    .then(grouping => {
      response.status(201).send(_.pick(grouping, ["_id", "name", "type"]));
    })
    .catch(error => response.status(409).send({ error }));
};

const handleGetAllGrouping = (request, response) => {
  let { loggedInUser } = request;

  Grouping.find({ user: loggedInUser._id })
    .then(groupings => {
      response.status(200).send(groupings);
    })
    .catch(error => console.log(error));
};

const handlePutGrouping = (request, response) => {
  let { loggedInUser } = request;
  let {name, _id} = request.body;
    // let _id = request.params['id'];

    Grouping.findOne({ _id })
      .then( grouping => {

        if(!grouping.user.equals(loggedInUser._id))
          response.status(403).send({error: 'auth'});

        return Grouping.findOneAndUpdate({ _id}, {$set: {name}}, {new: true});
      })
      .then(gr=> response.status(200).send(gr))
      .catch(error => {
        console.log(error);
        response.status(409).send({ error});
      });
}

const handleDeleteGrouping = (request, response) => {
  let { loggedInUser } = request;
    let _id = request.params['id'];

    Grouping.findOne({ _id })
      .then( grouping => {

        if(!grouping.user.equals(loggedInUser._id))
          response.status(403).send({error: 'auth'});

        return grouping.remove();
      })
      .then(gr=> response.status(200).send(gr))
      .catch(error => {
        response.status(409).send({error});
      });
}

const handleGetGrouping = (request, response) => {
  let accountsToSend;

    Grouping.findOne({ _id: request.params["id"] })
      .then(gr => {
        if (!gr.user.equals(request.loggedInUser._id)) return response.sendStatus(403);

        return response.status(200).send(gr);
      })
      .catch(error => response.sendStatus(500));
}

module.exports = {
  handlePostGrouping,
  handleGetAllGrouping,
  handleDeleteGrouping,
  handleGetGrouping,
  handlePutGrouping
};
