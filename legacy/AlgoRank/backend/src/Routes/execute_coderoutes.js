import express from "express";
import { verfiyJWT } from "../Middleware/userverifymiddlware.js";
import  {executionRouter, submitCodeHandler}  from "../Controller/execute_code.js";
const  router=express.Router();

// Primary POST endpoints (used by frontend)
router.post("/", verfiyJWT, executionRouter);
router.post("/submit", verfiyJWT, submitCodeHandler);

// Friendly GET responses to avoid "Cannot GET /..." when visited in browser
// Enforce POST-only: respond 405 for non-POST methods on these routes
router.all(["/", "/submit"], (req, res, next) => {
	if (req.method !== "POST") {
		return res.status(405).json({ message: `Method ${req.method} not allowed on this endpoint. Use POST.` });
	}
	next();
});

export default router;