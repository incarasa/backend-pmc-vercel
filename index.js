// index.js  (sin cambios raros)
const express = require("express");
const cors    = require("cors");
const app     = express();
const chatGPTRoutes = require("./routes/chatGPT");

app.use(cors());
app.use(express.json());          // el parser estándar
app.use("/chatGPT", chatGPTRoutes);

module.exports = app;             // solo exportas la app