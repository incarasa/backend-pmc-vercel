const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
require("dotenv").config();

const openAIClient = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY
});

// Lista actualizada de campos esperados
const CAMPOS_ESPERADOS = [
  "tipo_tasa",
  "valor_tasa",
  "periodo",
  "monto",
  "plazo_unidad_de_tiempo"
];

router.post("/", async (req, res) => {
  const { texto_usuario } = req.body;

  const prompt = `
Extrae la información clave del siguiente texto financiero:
"${texto_usuario}"

Devuelve un JSON con los siguientes campos:
- "tipo_tasa": "nominal" o "efectiva" (las tasas vencidas son efectivas)
- "valor_tasa": número en porcentaje
- "periodo": "diaria", "semanal", "mensual", "bimestral", "trimestral", "semestral", "anual", etc.
- "capitalizacion": "mensual", "anual", etc. (si la tasa es efectiva, poner null, si es nominal, poner la unidad de capitalización) 
    Una tasa del 12% NS/MV quiere decir nominal semestral y capitalización mensual. A(anual), S (semestral), T (trimestral), B (bimestral), M (mensual), D (diaria), W (semanal).
- "monto": número en la moneda indicada
- "plazo_unidad_de_tiempo": cantidad de días, debes convertir la unidad de tiempo mencionada a días de ser necesario (si no se menciona ninguna unidad de tiempo, poner null)
`;

  try {
    const response = await openAIClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Eres un asistente financiero experto en tasas de interés." },
        { role: "user", content: prompt }
      ]
    });

    const respuestaTexto = response.choices[0].message.content;

    const regex = /{[\s\S]*?}/;
    const match = respuestaTexto.match(regex);

    if (!match) {
      return res.status(500).json({
        error: "No se encontró un bloque JSON válido.",
        rawResponse: respuestaTexto
      });
    }

    let resultado;
    try {
      resultado = JSON.parse(match[0]);
    } catch (parseError) {
      return res.status(500).json({
        error: "No se pudo parsear la respuesta a JSON",
        rawResponse: respuestaTexto
      });
    }

    const faltantes = CAMPOS_ESPERADOS.filter(
      campo => !resultado.hasOwnProperty(campo) || resultado[campo] === null || resultado[campo] === ""
    );

    if (faltantes.length > 0) {
      return res.json({
        faltantes,
        pregunta: `Faltan los siguientes campos: ${faltantes.join(", ")}. ¿Podrías indicarlos?`
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
