// api/transcribe.js
import { client } from "./utils.js";
import Busboy from "busboy";

export const config = {
  api: {
    bodyParser: false, // Required for Busboy
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Multipart (audio upload)
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    const busboy = Busboy({ headers: req.headers });
    let audioBuffer;

    return new Promise((resolve) => {
      busboy.on("file", (_name, file) => {
        const chunks = [];
        file.on("data", (c) => chunks.push(c));
        file.on("end", () => (audioBuffer = Buffer.from(chunks)));
      });

      busboy.on("finish", async () => {
        try {
          // 1. Transcribe audio
          const transcript = await client.audio.transcriptions.create({
            file: audioBuffer,
            model: "gpt-4o-transcribe",
          });

          // 2. Chat reply
          const chat = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are Dentalist AI, a friendly dental receptionist." },
              { role: "user", content: transcript.text }
            ]
          });

          const replyText = chat.choices[0].message.content;

          // 3. Convert text → voice
          const speech = await client.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: replyText,
          });

          return resolve(
            res.status(200).json({
              text: replyText,
              audio: `data:audio/mp3;base64,${speech.audio_base64}`,
            })
          );

        } catch (err) {
          console.error("Error in transcribe:", err);
          return resolve(res.status(500).json({ error: "Processing Failed" }));
        }
      });

      req.pipe(busboy);
    });
  }

  // If someone sends non multipart
  res.status(400).json({ error: "Use multipart/form-data for audio uploads." });
}
