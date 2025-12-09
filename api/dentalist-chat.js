// api/dentalist-chat.js

const ALLOWED_ORIGIN = "https://www.dentalistai.com"; // change if needed

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are Dentalist AI, a friendly and professional receptionist for a dental clinic. Help patients book appointments, ask about treatments, pricing, hours, and more.",
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("OpenAI chat error:", json);
      return res.status(500).json({ error: json });
    }

    return res.status(200).json({
      reply:
        json.choices?.[0]?.message?.content ||
        "Sorry, I couldn’t understand that.",
    });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
