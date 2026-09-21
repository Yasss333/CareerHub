import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import openai from '../config/ai.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const createChatCompletion = (request) => openai.chat.completions.create(request);

// Enhance professional summary
router.post('/enhance-pro-sum', authenticate, async (req, res) => {
  try {
    const { userContent } = req.body;
    const model = process.env.MODEL_NAME || "gpt-4o-mini";
    
    if (!userContent) {
      return res.status(400).json({ message: "User content not provided, missing required fields" });
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
});

// Enhance job description
router.post('/enhance-job-desc', authenticate, async (req, res) => {
  try {
    const { userContent } = req.body;
    if (!userContent) {
      return res.status(400).json({ message: "User content not provided, missing required fields" });
    }
    
    const response = await createChatCompletion({
      model: process.env.MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "You are a professional recruiter and job description optimization expert. Your task is to rewrite and enhance the user's job description to make it clear, structured, and professional. Ensure the description is ATS-friendly and easy to understand, with concise and well-organized content. Improve clarity, grammar, and flow while preserving the original meaning and responsibilities. Do not add false requirements, fake responsibilities, or unrealistic expectations. Keep the tone professional and neutral. Avoid unnecessary buzzwords and filler text. The output should be clean, readable, and suitable for posting on job portals or internal hiring platforms. Output only the enhanced job description.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });
    
    const enhancedSolution = response.choices[0].message.content;
    return res.status(200).json({ enhancedSolution });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// Get ATS score
router.post('/ats-score', authenticate, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user.id;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: "resumeId and jobDescription are required" });
    }

    // Fetch the resume
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });
    
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
});

// Generate cover letter
router.post('/cover-letter', authenticate, async (req, res) => {
  try {
    const { resumeId, companyName, jobTitle, notes } = req.body;
    const userId = req.user.id;

    if (!resumeId || !companyName) {
      return res.status(400).json({ message: "resumeId and companyName are required" });
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });
    
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
});

// Generate interview questions
router.post('/interview-questions', authenticate, async (req, res) => {
  try {
    const { resumeId, count = 5, types = ["technical", "behavioral"], focus = "", jobDescription = "" } = req.body;
    const userId = req.user.id;

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });
    
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
});

// Evaluate interview answer
router.post('/evaluate-answer', authenticate, async (req, res) => {
  try {
    const { resumeId, question, answer } = req.body;
    const userId = req.user.id;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId }
    });
    
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
});

// Upload and parse resume
router.post('/upload-resume', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
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
  "professionSummary": "",
  "skills": [],
  "personalInfo": {
    "image": "",
    "fullName": "",
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
      "startDate": "",
      "endDate": "",
      "description": "",
      "isCurrent": false
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

    const newResume = await prisma.resume.create({
      data: {
        userId,
        title,
        professionSummary: parsedData.professionSummary || '',
        skills: parsedData.skills || [],
        personalInfo: parsedData.personalInfo || {},
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        education: parsedData.education || [],
      }
    });

    if (!newResume || !newResume.id) {
      return res.status(400).json({ message: "Failed to create resume in database" });
    }

    return res.status(200).json({ resumeId: newResume.id, message: "Resume uploaded successfully" });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    
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
});

export default router;