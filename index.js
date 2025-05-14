const express = require("express");
const cors = require("cors");
const app = express();

const rawBodySaver = (req, res, buf) => {
  req.rawBody = buf;          // guarda el cuerpo tal cual
};

app.post("/echo", express.raw({ type: "*/*", verify: rawBodySaver }), (req, res) => {
  res.json({
    headers: req.headers,
    contentLengthHeader: req.headers["content-length"] || null,
    bytesReceived: req.rawBody.length,
    bodyAsString: req.rawBody.toString()
  });
});


const chatGPTRoutes = require("./routes/chatGPT");

app.use(cors());
app.use(express.json()); // ✅ correcto

app.use("/chatGPT", chatGPTRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

module.exports = app;