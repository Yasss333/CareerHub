import express from "express";
import { userCheckHandler, userLoginHandler, userLogoutHandler, userRegisterHandler } from "../Controller/auth.controller.js";
import {verfiyJWT} from "../Middleware/userverifymiddlware.js";
const router=express.Router();


router.post("/register",userRegisterHandler)
router.post("/login",userLoginHandler)
router.post("/logout", verfiyJWT, userLogoutHandler);
router.get("/check", verfiyJWT, userCheckHandler);

export default router;