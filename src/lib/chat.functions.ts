import { createServerFn } from "@tanstack/react-start";

interface AskInput {
  question: string;
  context: string;
}

export const askDashboard = createServerFn({ method: "POST" })
  .inputValidator((d: AskInput) => {
    if (!d || typeof d.question !== "string" || typeof d.context !== "string") {
      throw new Error("Invalid input");
    }
    if (d.question.length > 2000) throw new Error("Pregunta muy larga");
    if (d.context.length > 60000) throw new Error("Contexto muy grande");
    return d;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY no configurada");

    const system = `Eres un asistente experto en análisis de costos operativos de la flota móvil de Inversiones Norlima S.A. (Planta Lark).
Respondes en español, conciso, profesional, con cifras concretas en Soles peruanos (S/.).
Usa SOLO los datos del contexto. Si una pregunta no se puede responder con los datos, dilo claramente.
Formato: respuestas breves con bullets cuando ayuden. Nunca inventes cifras.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `CONTEXTO DEL DASHBOARD:\n${data.context}\n\nPREGUNTA: ${data.question}` },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Demasiadas solicitudes, intenta en unos segundos.");
    if (res.status === 402) throw new Error("Créditos de IA agotados.");
    if (!res.ok) throw new Error(`Error IA ${res.status}`);

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { answer: json.choices?.[0]?.message?.content ?? "(sin respuesta)" };
  });
