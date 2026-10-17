import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "missing-openrouter-key",
  baseURL: "https://openrouter.ai/api/v1",
});

export default openai;