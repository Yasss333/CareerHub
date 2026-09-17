// import OpenAI from "openai";

// const openai = new OpenAI({
//     apiKey: process.env.GEMINI_API_KEY ,
//     baseURL: process.env.baseURL
// });

// export default openai;
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export default openai;


// import { GoogleGenerativeAI } from "@google/generative-ai";
// console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);

// const genAI = new GoogleGenerativeAI(
//     process.env.GEMINI_API_KEY,
   
     
// );

// export default genAI;
