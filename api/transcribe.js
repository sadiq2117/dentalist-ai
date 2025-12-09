import OpenAI from "openai";
export const config = { runtime: "edge" };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req) {
  const contentType = req.headers.get("Content-Type") || "";

  // Voice upload
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const audio = form.get("audio");

    const transcript = await client.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-transcribe"
    });

    const reply = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: transcript.text }]
    });

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: reply.choices[0].message.content
    });

    return new Response(JSON.stringify({
      reply: reply.choices[0].message.content,
      audio: `data:audio/mp3;base64,${speech.audio_base64}`
    }), { status: 200 });
  }

  // Text mode
  const body = await req.json();
  const { text } = body;

  const reply = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: text }]
  });

  return new Response(JSON.stringify({
    reply: reply.choices[0].message.content
  }), { status: 200 });
}
