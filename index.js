const express = require("express");
const cors    = require("cors");
const app     = express();
const chatGPTRoutes = require("./routes/chatGPT");

// --- verificación fast ---
app.get("/_echo_ping", (req, res) => res.send("pong"));
// -------------------------

/* ───── RUTA DE DEPURACIÓN  SIN PARSER ─────────────────────────── */
const rawBodySaver = (req, res, buf) => { req.rawBody = buf; };

app.post(
  "/echo",
  express.raw({ type: "*/*", verify: rawBodySaver }),   // ← NO usa parser json
  (req, res) => {
    res.json({
      headers: req.headers,
      contentLengthHeader: req.headers["content-length"] || null,
      bytesReceived: req.rawBody.length,
      bodyAsString: req.rawBody.toString()
    });
  }
);
/* ──────────────────────────────────────────────────────────────── */

app.use(cors());
app.use(express.json());          //  ⬅️  A partir de aquí sí parseamos JSON

app.use("/chatGPT", chatGPTRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

module.exports = app;