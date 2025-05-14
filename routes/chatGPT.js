const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

  if (typeof texto_usuario !== "string" || texto_usuario.trim() === "") {
  return res.status(400).json({ error: "El campo 'texto_usuario' es obligatorio y debe ser texto." });
  }

  // Ajustamos el prompt para indicarle al modelo cómo interpretar notaciones abreviadas de tasas nominales
  const prompt = `
Extrae la información clave del siguiente texto financiero:
"${texto_usuario}"

Devuelve un JSON con los siguientes campos:
- "tipo_tasa": "nominal" o "efectiva" (las tasas vencidas son efectivas). IMPORTANTE:
  - Si aparece explícitamente la palabra "nominal" o una notación que empiece por "N" (por ejemplo NA, NS, NB, NT, NM, ND, NW, etc.), entonces la tasa es "nominal".
  - Si aparece "efectiva" o "EA" o algo que indique efectividad, es "efectiva".
  - Si aparece "vencida" sin la palabra "nominal", asume que es "efectiva".
- "valor_tasa": número en porcentaje (ej. 10.25).
- "periodo": "diaria", "semanal", "mensual", "bimestral", "trimestral", "semestral", "anual", etc.
  - Ejemplo: NA/MV quiere decir "Nominal Anual" (NA) con capitalización mensual (MV), por lo tanto "periodo" = "anual".
  - Ejemplo: NS/MV quiere decir "Nominal Semestral" con capitalización mensual, entonces "periodo" = "semestral".
- "capitalizacion": "mensual", "anual", etc. (si la tasa es efectiva, poner null; si es nominal, poner la unidad de capitalización).
  - Las abreviaturas tras la barra en la notación nominal indican la capitalización. Por ejemplo, "MV" (mes vencido) => "mensual", "DV" (día vencido) => "diaria", "TV" (trimestre vencido) => "trimestral", etc.
  - Una tasa del 12% NS/MV quiere decir nominal semestral y capitalización mensual. 
  - A (anual), S (semestral), T (trimestral), B (bimestral), M (mensual), D (diaria), W (semanal).
- "monto": número en la moneda indicada.
- "plazo_unidad_de_tiempo": cantidad de días. Debes convertir la unidad de tiempo mencionada a días de ser necesario (si no se menciona ninguna unidad de tiempo, poner null).

Entrega la respuesta estrictamente en formato JSON (sin texto adicional) y encierra la respuesta completa en un bloque JSON.
`;

  try {
    const response = await openAIClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Eres un asistente financiero experto en tasas de interés." },
        { role: "user", content: prompt }
      ]
    });

    const respuestaTexto = response.choices[0].message.content;

    // Buscamos el primer bloque que luzca como JSON
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

    // Verificamos si faltan campos obligatorios
    const faltantes = CAMPOS_ESPERADOS.filter(
      campo => !resultado.hasOwnProperty(campo) || resultado[campo] === null || resultado[campo] === ""
    );

    if (faltantes.length > 0) {
      return res.json({
        faltantes,
        pregunta: `Faltan los siguientes campos: ${faltantes.join(", ")}. ¿Podrías indicarlos?`
      });
    }

    // Enviamos el resultado al cliente
    res.json(resultado);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
