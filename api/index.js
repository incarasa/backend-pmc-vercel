const serverless = require("serverless-http");
const app = require("../index"); // importa tu app de Express

module.exports = serverless(app, { bodyParser: false });