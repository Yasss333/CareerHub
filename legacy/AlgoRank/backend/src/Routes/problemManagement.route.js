import express from "express";
import {
  createProblemHandler,
  getallProblemHandler,
  getProblemByIDHandler,
  updateProblemByIDHandler,
  deleteProblemByIDHandler,
  getSolvedProblemByUserHandler,
  getProblemsByTags,
  getAllTags,
  
} from "../Controller/priblem.contoller.js"; 
import { verfiyJWT, validateAdmin } from "../Middleware/userverifymiddlware.js";
 const router=express.Router();

// router.post("/create-problem",  createProblemHandler);
router.post("/create-problem", verfiyJWT, validateAdmin, createProblemHandler);
router.get("/get-all-problems", verfiyJWT,getallProblemHandler);
router.get("/get-problem/:id", verfiyJWT,getProblemByIDHandler);
router.get("/filter", verfiyJWT, getProblemsByTags);
router.get("/tags", verfiyJWT, getAllTags);
router.put("/update-problem/:id", verfiyJWT,validateAdmin,updateProblemByIDHandler);
router.delete("/delete-problem/:id", verfiyJWT,validateAdmin,deleteProblemByIDHandler);
router.get("/get-solved-problem", verfiyJWT,getSolvedProblemByUserHandler);


export default router;