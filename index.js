const express = require("express");
const app = express();

const cors = require("cors");
const chatGPTRoutes = require("./routes/chatGPT");

// Middleware
app.use(cors()); // Habilita CORS
app.use(express.json()); // Analiza JSON (reemplaza a body-parser)

// Rutas
app.use("/chatGPT", chatGPTRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

// Exportar la app para Vercel (serverless)
module.exports = app;