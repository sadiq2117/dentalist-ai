// api/dentalist-chat.js
import { client, readJson } from "./utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = await readJson(req);

  if (!body.message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Dentalist AI, a warm and human-like dental receptionist." },
        { role: "user", content: body.message }
      ]
    });

    return res.status(200).json({
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error("Chat API Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
