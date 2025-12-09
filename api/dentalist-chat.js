// api/dentalist-chat.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS helper so Wix can call this safely
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `
You are **Dentalist AI**, a warm, human-sounding receptionist for a modern dental clinic.
Goals:
- Make patients feel understood and cared for.
- Help with booking, rescheduling, cancellations, and FAQs.
- Ask gentle follow-up questions (date, time, type of visit, pain level, etc.).
- Keep answers short, clear, and conversational. No long paragraphs.
- Never invent medical diagnoses. For anything clinical, suggest speaking with the dentist.
Tone:
- Friendly, calm, reassuring, like a real receptionist.
- Use simple language.
- Adapt to the patient's mood (nervous, in pain, just curious).
If you need details, ask one or two specific questions instead of many at once.
    `.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I’m here to help with your dental visit. How can I assist you today?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({
      error: "Something went wrong talking to Dentalist AI.",
    });
  }
}
