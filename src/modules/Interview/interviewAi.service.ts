import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";

export const ai = new GoogleGenAI({ apiKey: env.api.API_KEY });

async function invokeGeminiAi() {
  const res = await ai.models.generateContent({
    model : "gemini-2.5-flash",
    contents: "hello gemini ai ! what is interview?"
  })
  console.log(res.text)
}

export default  invokeGeminiAi