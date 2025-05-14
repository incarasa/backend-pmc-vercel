// api/index.js – sin serverless-http
const app = require("../index");          // tu instancia Express

module.exports = (req, res) => {
  app(req, res);                          // ⬅️  pasa req/res a Express
};