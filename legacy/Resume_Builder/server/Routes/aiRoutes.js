import express from "express";
import verifyJWT from "../middlewares/Authmiddleware.js";
import { enhanceJobDescription, evaluateAnswer,generateInterviewQuestions,enhanceProfessionalSummary, uploadResume ,getATSScore  ,generateCoverLetter } from "../Controller/AI.controller.js";

const AIRouter=express.Router();

AIRouter.post("/enhance-pro-sum", verifyJWT,enhanceProfessionalSummary)
AIRouter.post("/enhance-pro-job", verifyJWT,enhanceJobDescription )
AIRouter.post("/upload-resume", verifyJWT, uploadResume)
AIRouter.post("/ats-score", verifyJWT, getATSScore);
AIRouter.post("/cover-letter", verifyJWT, generateCoverLetter);
AIRouter.post("/interview/generate", verifyJWT, generateInterviewQuestions);

AIRouter.post("/interview/evaluate", verifyJWT, evaluateAnswer);
export default AIRouter;