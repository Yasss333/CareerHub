import bcrypt from "bcryptjs";
import { db } from "../libs/db.js";
import { UserRole } from "@prisma/client";

import jwt from "jsonwebtoken";

const userRegisterHandler = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existinguser = await db.user.findUnique({
      where: { email },
    });

    if (existinguser) {
    return   res.status(400).json({
        error: "User already Exist",
      });
    }
    const hashedpassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedpassword,
        name,
        role: UserRole.USER,
      },
    });

    console.log("JWT SECRET:", process.env.SECRET);
    console.log("USER ID:", user?.id);

    const token = jwt.sign({ id: user.id }, process.env.SECRET, {
      expiresIn: "10d",
    });
      console.log("Token : ",token);
      
    res.cookie("jwt", token, {
      httpOnly: true,
      // sameSite: "strict",
      sameSite: "none",
      // secure: false, // true in production
      secure: true, // true in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User Created ",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      token: token, // Also send token in response body for frontend to save
    });
  } catch (error) {
    console.error("Creating User :", error);
    res.status(400).json({
      message: "register Failed",
      error,
    });
  }
};

const userLoginHandler = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(401).json({
        message: "User Does not exist , Please try again ",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        message: "User Does not exist , Please try again wrog credentnials ",
      });
    }
    const token = jwt.sign({ id: user.id }, process.env.SECRET, {
      expiresIn: "10d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // true in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User loged in  ",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      token: token, // Also send token in response body for frontend to save
    });
  } catch (error) {}
};

const userLogoutHandler = async (req, res) => {
  try {
    const { problemIDs } = req.body || {};

    if (req.user && Array.isArray(problemIDs) && problemIDs.length > 0) {
      const ids = [...new Set(problemIDs)];
      if (req.user.role === "ADMIN") {
        await db.submission.deleteMany({ where: { problemID: { in: ids } } });
        await db.problem.deleteMany({ where: { id: { in: ids }, userID: req.user.id } });
      }
    }

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // true in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Milte hau bhai bye",
    });
  } catch (error) {
    res.status(400).json({
      message: "Logout Failed",
      error,
    });
  }
};
const userCheckHandler = async (req, res) => {
  console.log("Ho gaya check bhai ");
    if (!req.user) {
    return res.status(200).json({
      success: true,
      message: "User not logged in",
      user: null,
    });
  }
  const user= await db.user.findUnique({
    where:{
      id:req.user.id
    },
    select:{
      role:true,
      name:true,
      email:true,
      image:true
    }
  })
  res.status(200).json({
    success: true , 
    message:"Ha bhai karliya check bohot  khub",
    user:user,
    
    })
 
};
  
export {
  userRegisterHandler,
  userLoginHandler,
  userLogoutHandler,
  userCheckHandler,
};
