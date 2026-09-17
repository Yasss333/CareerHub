//this controller is for the ai used to enhance the text

import { response } from "express";
import genAI from "../config/ai.js";
import Resume from "../models/resuem.model.js";
import OpenAI from "openai";
import openai from "../config/ai.js";
//POST:/api/ai/ehance-pro-sum

const createChatCompletion = (request) => openai.chat.completions.create(request);

const normalizeResumeForDb = (resumeData) => {
  const normalized = structuredClone(resumeData || {});
  const personalInfo = normalized.personal_info || {};

  if (normalized.professional_summary !== undefined) {
    normalized.proffession_summary = normalized.professional_summary;
    delete normalized.professional_summary;
  }

  if (personalInfo.profession !== undefined) {
    personalInfo.proffesion = personalInfo.profession;
    delete personalInfo.profession;
  }
  normalized.personal_info = personalInfo;

  if (Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience.map((exp) => {
      const mapped = { ...exp };
      if (mapped.position !== undefined) {
        mapped.positon = mapped.position;
        delete mapped.position;
      }
      return mapped;
    });
  }

  if (Array.isArray(normalized.project) && !Array.isArray(normalized.projects)) {
    normalized.projects = normalized.project;
  }
  delete normalized.project;

  return normalized;
};

export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;
    const model = process.env.MODEL_NAME || "gpt-4o-mini";
    if (!userContent) {
      return res.status(400).json({ message: "User content not provided, missing required fields" });
    }
    if (!model) {
      return res.status(400).json({ message: "Model name not set in environment" });
    }

    const systemPrompt = `
You are a professional resume writer and ATS optimization expert. Your task is to rewrite and enhance the user's professional summary to make it clear, concise, and professional. The summary must be ATS-friendly with no fluff, emojis, or special symbols. Use confident but natural language suitable for software engineering, tech, or professional roles. Ensure the content is grammatically correct, well-structured, and impact-driven, focusing on skills, experience, and value. Do not add false experience or fake achievements. Do not change the core meaning of the user's content. Do not mention that AI was used. Keep the output limited to 3–4 short, strong sentences. Avoid unnecessary buzzwords and use action-oriented language. Output only the enhanced professional summary.
    `;

    const response = await createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    });

    const enhancedSolution = response.choices[0].message.content;
    return res.status(200).json({ enhancedSolution });
  } catch (error) {
    console.error("AI enhance error:", error);
    return res.status(400).json({ message: error.message, stack: error.stack });
  }
};

//this controller id for ehancing the job description
// POST:/api/ai/enhance-job-desc

export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;
    if (!userContent) {
      return res
        .status(400)
        .json({ message: "User content not provided, missin required fields" });
    }
    const response = await createChatCompletion({
      model: process.env.MODEL_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a professional recruiter and job description optimization expert. Your task is to rewrite and enhance the user's job description to make it clear, structured, and professional. Ensure the description is ATS-friendly and easy to understand, with concise and well-organized content. Improve clarity, grammar, and flow while preserving the original meaning and responsibilities. Do not add false requirements, fake responsibilities, or unrealistic expectations. Keep the tone professional and neutral. Avoid unnecessary buzzwords and filler text. The output should be clean, readable, and suitable for posting on job portals or internal hiring platforms. Output only the enhanced job description.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });
    const enhancedSolution  = response.choices[0].message.content;
    return res.status(200).json({ enhancedSolution  });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//ATS Controller
export const getATSScore = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.userId;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: "resumeId and jobDescription are required" });
    }

    // Fetch the resume
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Build prompt for AI
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst. Your task is to evaluate the given resume against the provided job description. Return a JSON object with exactly these fields:
- score: a number between 0 and 100 representing the match percentage.
- keywordMatch: an object with two arrays: "present" (keywords from the job description found in the resume) and "missing" (keywords not found).
- suggestions: an array of specific, actionable recommendations to improve the resume for this job.

Be strict but fair. Consider skills, experience, education, and projects. Do not mention you are an AI.`;

    const userPrompt = `Job Description:\n${jobDescription}\n\nResume Data (JSON):\n${JSON.stringify(resume, null, 2)}`;

    const response = await createChatCompletion({
      model: process.env.MODEL_NAME || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return res.status(200).json(result);
  } catch (error) {
    console.error("ATS Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//Cover letter creater 
export const generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, companyName, jobTitle, notes } = req.body;
    const userId = req.userId;

    if (!resumeId || !companyName) {
      return res.status(400).json({ message: "resumeId and companyName are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const systemPrompt = `You are a professional cover letter writer. Write a concise, confident cover letter tailored to the job description. Use the user's experience, skills, and projects from the resume. Be specific, avoid generic phrases. Do not mention AI. Keep it to 3-4 paragraphs. Format it as plain text with line breaks.`;

    let userPrompt = `Resume Data:\n${JSON.stringify(resume, null, 2)}\n\n`;
    userPrompt += `Company: ${companyName}\n`;
    if (jobTitle) userPrompt += `Job Title: ${jobTitle}\n`;
    if (notes) userPrompt += `Additional Notes: ${notes}\n`;
    userPrompt += `Write a cover letter.`;

    const response = await createChatCompletion({
      model: process.env.MODEL_NAME || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const coverLetter = response.choices[0].message.content;
    return res.status(200).json({ coverLetter });
  } catch (error) {
    console.error("Cover Letter Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//Resume Based Interview 
// Generate interview questions
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { resumeId, count = 5, types = ["technical", "behavioral"], focus = "", jobDescription = "" } = req.body;
    const userId = req.userId;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const systemPrompt = `You are an expert interview coach. Generate ${count} interview questions for a candidate based on their resume. The questions should be realistic and tailored to their experience. Return a JSON array of objects with fields: "question", "category" (one of "technical", "behavioral", "system design"). Do not include answers.`;

    let userPrompt = `Resume: ${JSON.stringify(resume, null, 2)}\n`;
    if (focus) userPrompt += `Focus area: ${focus}\n`;
    if (jobDescription) userPrompt += `Job Description: ${jobDescription}\n`;
    if (types.length) userPrompt += `Include these categories: ${types.join(", ")}\n`;

    const response = await createChatCompletion({
      model: process.env.MODEL_NAME || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const questions = result.questions || [];
    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Generate questions error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Evaluate a single answer
export const evaluateAnswer = async (req, res) => {
  try {
    const { resumeId, question, answer } = req.body;
    const userId = req.userId;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const systemPrompt = `You are an expert interview evaluator. Evaluate the candidate's answer to the interview question. Provide a rating (Excellent, Good, Needs Improvement), detailed feedback on strengths and areas for improvement, and a model answer. Return JSON: { rating: string, feedback: string, modelAnswer: string }`;

    const userPrompt = `Resume: ${JSON.stringify(resume, null, 2)}\n\nQuestion: ${question}\n\nCandidate's Answer: ${answer}`;

    const response = await createChatCompletion({
      model: process.env.MODEL_NAME || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const evaluation = JSON.parse(response.choices[0].message.content);
    return res.status(200).json(evaluation);
  } catch (error) {
    console.error("Evaluation error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//controller for resume uploads
//POST:/api/ai/uplaod-resume

//refactoring hte whole contreoller because chanfing the openAI sdk to gemini sdk

export const uploadResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeText, title } = req.body;
    
    if (!resumeText || !title) {
      return res.status(400).json({ message: "Missing fields: resumeText and title are required" });
    }

    if (typeof resumeText !== "string" || resumeText.trim().length === 0) {
      return res.status(400).json({ message: "Resume text is empty or invalid" });
    }

    const systemPrompt = `
You are a highly accurate resume parsing AI.

Your job is to extract structured information from resume text and return ONLY valid JSON.

Strict rules:
- Output must be valid JSON.
- Do NOT include explanations.
- Do NOT include markdown.
- Do NOT include comments.
- Do NOT include schema definitions.
- Return only real extracted values.
- If a value is missing, return "" or [].
- Do not hallucinate information.
- Boolean fields must be true or false.
`;

    const userPrompt = `
Extract structured information from the following resume text.

Return ONLY JSON in this exact format:

{
  "professional_summary": "",
  "skills": [],
  "personal_info": {
    "image": "",
    "full_name": "",
    "profession": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "experience": [
    {
      "company": "",
      "position": "",
      "start_date": "",
      "end_date": "",
      "description": "",
      "is_current": false
    }
  ],
  "projects": [
    {
      "name": "",
      "type": "",
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "gpa": 0
    }
  ]
}

Resume Text:
${resumeText}
`;

    const response = await createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    // console.log("MODEL:", process.env.MODEL_NAME);

    const extractedData = response.choices[0].message.content;
    
    if (!extractedData) {
      return res.status(400).json({ message: "Failed to extract data from resume" });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(extractedData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(400).json({ message: "Failed to parse extracted resume data" });
    }

    const parsedExtratedData = normalizeResumeForDb(parsedData);

    const newResume = await Resume.create({
      userId,
      title,
      ...parsedExtratedData,
    });

    if (!newResume || !newResume._id) {
      return res.status(400).json({ message: "Failed to create resume in database" });
    }

    return res.status(200).json({ resumeId: newResume._id, message: "Resume uploaded successfully" });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    
    // Handle specific OpenAI errors
    if (error.code === "invalid_request_error") {
      return res.status(400).json({ message: "Invalid request to AI service. Resume text may be too long or improperly formatted." });
    }
    
    if (error.code === "rate_limit_error") {
      return res.status(429).json({ message: "Rate limit exceeded. Please try again in a moment." });
    }

    if (error.message?.includes("JSON") || error.message?.includes("parse")) {
      return res.status(400).json({ message: "Failed to parse resume data. Please ensure the PDF contains readable text." });
    }

    return res.status(400).json({ 
      message: error.message || "An error occurred while uploading the resume"
    });
  }
};

//this tjhe conroler woithj gemini sdk can be used for the gemini sdk

// export const uploadResume = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const { resumeText, title } = req.body;

//     if (!resumeText || !title) {
//       return res.status(400).json({ message: "Missing resume text or title" });
//     }

//     // 🔹 Get Gemini model
//     const model = genAI.getGenerativeModel({
//       model: "models/gemini-1.5-flash"
//     });

//     // 🔹 System instructions
//     const systemPrompt = `
// You are an expert resume parsing AI.

// Your job is to extract structured data from resumes and return ONLY valid JSON.

// Rules:
// - Output must be strictly valid JSON.
// - Do not include explanations.
// - Do not include markdown.
// - If a field is missing, return "" or [].
// - Do not hallucinate data.
// `;

//     // 🔹 User prompt with clean JSON template
//     const userPrompt = `
// Extract structured information from this resume.

// Return ONLY valid JSON in this format:

// {
//   "professional_summary": "",
//   "skills": [],
//   "personal_info": {
//     "image": "",
//     "full_name": "",
//     "profession": "",
//     "email": "",
//     "phone": "",
//     "location": "",
//     "linkedin": "",
//     "website": ""
//   },
//   "experience": [
//     {
//       "company": "",
//       "position": "",
//       "start_date": "",
//       "end_date": "",
//       "description": "",
//       "is_current": false
//     }
//   ],
//   "projects": [
//     {
//       "name": "",
//       "type": "",
//       "description": ""
//     }
//   ],
//   "education": [
//     {
//       "institution": "",
//       "degree": "",
//       "field": "",
//       "gpa": ""
//     }
//   ]
// }

// Resume Text:
// ${resumeText}
// `;

// const response = await openai.chat.completions.create({
//   model: "gpt-4o-mini",
//   messages: [
//     { role: "system", content: SYSTEM_PROMPT },
//     { role: "user", content: userPrompt },
//   ],
// });

//     // 🔹 Generate AI response
//     // const result = await model.generateContent({
//     //   contents: [
//     //     { role: "user", parts: [{ text: systemPrompt + "\n" + userPrompt }] }
//     //   ],
//     //   generationConfig: {
//     //     responseMimeType: "application/json"
//     //   }
//     // });

//     // const response = await result.response;
//     const text = response.text();

//     // 🔹 Safe JSON parse
//     let parsedData;
//     try {
//       parsedData = JSON.parse(text);
//     } catch (err) {
//       console.log("AI returned invalid JSON:", text);
//       return res.status(400).json({ message: "Invalid AI response format" });
//     }

//     // 🔹 Save to Mongo
//     const newResume = await Resume.create({
//       userId,
//       title,
//       ...parsedData
//     });

//     return res.status(200).json({ resumeId: newResume._id });

//   } catch (error) {
//     console.log("GEMINI ERROR:", error);
//     return res.status(500).json({ message: "AI processing failed , abhi gemeni key is not working soon will....." });
//   }
// };
