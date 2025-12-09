// api/transcribe.js
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // we use formidable for multipart
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS helper
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
    // 1) Parse audio file from multipart/form-data
    const form = new formidable.IncomingForm();

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = files.audio;
    if (!audioFile) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const audioPath = Array.isArray(audioFile)
      ? audioFile[0].filepath
      : audioFile.filepath;

    const audioStream = fs.createReadStream(audioPath);

    // 2) Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: "en",
    });

    const userText = transcription.text?.trim() || "";

    // 3) Get Dentalist AI reply
    const systemPrompt = `
You are Dentalist AI, the same receptionist as in the text chat.
Reply in a short, natural, spoken style – like you're talking out loud.
Avoid lists and bullet points. Respond in one or two concise sentences.
    `.trim();

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText || "The audio was empty." },
      ],
    });

    const replyText =
      chat.choices?.[0]?.message?.content ||
      "I heard you, but I’m not sure what you said. Could you please repeat that?";

    // 4) Turn reply into audio (TTS)
    const speechResponse = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy", // warm neutral voice
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    // 5) Return everything
    return res.status(200).json({
      userText,
      replyText,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
    });
  } catch (err) {
    console.error("Transcribe API error:", err);
    return res.status(500).json({
      error: "Something went wrong with voice processing.",
    });
  }
}

