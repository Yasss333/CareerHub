import OpenAI from "openai";

let instance = null;
let currentKey = null;

export const getOpenAI = () => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() || "missing-openrouter-key";
  if (!instance || currentKey !== apiKey) {
    currentKey = apiKey;
    instance = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return instance;
};

const openai = new Proxy({}, {
  get(target, prop) {
    return getOpenAI()[prop];
  }
});

export default openai;