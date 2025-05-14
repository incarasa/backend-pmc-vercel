const express = require("express");
const cors    = require("cors");
const app     = express();
const chatGPTRoutes = require("./routes/chatGPT");

app.use(cors());
app.use(express.json());      //  ← sí lo necesitamos ahora

app.use("/chatGPT", chatGPTRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

module.exports = app;