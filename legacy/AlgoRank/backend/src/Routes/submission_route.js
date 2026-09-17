import express from "express";
import { verfiyJWT } from "../Middleware/userverifymiddlware.js ";
import { getallsubHandler, getsubmissionByIDHandler, submissionCountHandler } from "../Controller/submission_details.js";

const router=express.Router();

router.get("/get-all-submission",verfiyJWT,getallsubHandler)
router.get("/get-submissions/:problemID",verfiyJWT,getsubmissionByIDHandler )
router.get("/get-submission-count/:problemID",verfiyJWT,submissionCountHandler) 
export default router;