import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key no configurada." }, { status: 500 });
  }

  const body = await req.json();
  const { descripcion, zona, presupuesto, disponibilidad } = body;

  if (!descripcion || descripcion.trim().length < 10) {
    return NextResponse.json({ error: "Descripción muy corta." }, { status: 400 });
  }

  const prompt = `Eres un experto en mercado comercial de Ciudad de México (CDMX).
Un emprendedor describe su situación así:

"${descripcion}"

${zona ? `Zona preferida: ${zona}` : ""}
${presupuesto ? `Presupuesto de renta mensual: $${presupuesto} MXN` : ""}
${disponibilidad && disponibilidad.length > 0 ? `Disponibilidad: ${disponibilidad.join(", ")}` : ""}

Analiza la situación y extrae:
1. El giro de negocio implícito
2. Los requisitos físicos del espacio que necesita (m², servicios, características)
3. Las 3 mejores colonias de CDMX para ese giro, con razón y nivel de oportunidad
4. Si el presupuesto es viable para esas zonas (si se proporcionó)
5. Alertas importantes y consejos prácticos

Responde ÚNICAMENTE con un JSON válido sin markdown, con esta estructura exacta:
{
  "giro_detectado": "string",
  "resumen_interpretacion": "string de 1-2 oraciones describiendo lo que entendiste",
  "requisitos_espacio": {
    "m2_minimo": number,
    "m2_ideal": number,
    "servicios_necesarios": ["string"],
    "caracteristicas_deseables": ["string"]
  },
  "colonias_recomendadas": [
    {
      "nombre": "string",
      "razon": "string",
      "nivel_competencia": "bajo|medio|alto",
      "nivel_oportunidad": number
    }
  ],
  "presupuesto_viable": boolean,
  "mensaje_presupuesto": "string",
  "alertas": ["string"],
  "consejos": ["string"]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.map((b: { text?: string }) => b.text || "").join("").trim();
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al analizar. Intenta de nuevo." }, { status: 500 });
  }
}
