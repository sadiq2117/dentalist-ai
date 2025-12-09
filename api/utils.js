// api/utils.js
import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Reads JSON from POST body
export function readJson(req) {
  return new Promise((resolve) => {
    let buffer = "";
    req.on("data", (chunk) => buffer += chunk);
    req.on("end", () => resolve(JSON.parse(buffer || "{}")));
  });
}
