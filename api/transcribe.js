// api/transcribe.js

const ALLOWED_ORIGIN = "https://www.dentalistai.com"; // change if needed

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const FormData = require("form-data");

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    // Base64 → Buffer
    const buffer = Buffer.from(audio, "base64");

    const form = new FormData();
    form.append("file", buffer, {
      filename: "voice.webm",
      contentType: "audio/webm",
    });
    form.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Transcribe error:", json);
      return res.status(500).json({ error: json });
    }

    return res.status(200).json({ text: json.text || "" });
  } catch (err) {
    console.error("Transcription server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
