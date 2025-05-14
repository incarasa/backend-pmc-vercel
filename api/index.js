const app = require("../index");

module.exports = (req, res) => {
  app(req, res);                  // pasa el control a Express
};