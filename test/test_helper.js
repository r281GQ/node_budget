const request = require("supertest");

const getToken = (app, callBack) => {
  return request(app)
    .post("/api/logIn")
    .set("Content-Type", "application/json")
    .send({
      email: "endre@mail.com",
      password: "123456"
    })
    .end((err, response) => {
      let token = response.headers["x-auth"];
      callBack(token);
    });
};

module.exports = getToken;
