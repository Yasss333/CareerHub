import express from "express";
import { getUserId, getUserResume, loginUser, userregisterhandler } from "../Controller/useRegisterCont.js";
import verifyJWT from "../middlewares/Authmiddleware.js";

const router=express.Router();

router.post("/register",userregisterhandler);
router.post('/login',loginUser);
router.get("/data",verifyJWT,getUserId)
router.get("/resumes",verifyJWT,getUserResume)

export default router;