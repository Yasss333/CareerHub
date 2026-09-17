import Resume from "../models/resuem.model.js";
import User from "../models/user.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const generateToken=(userId)=>{
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'7d'})
}

export const userregisterhandler=async(req,res)=>{
    const {name , email , password}=req.body;
    try {
        if(!name|| !email ||!password){
            return res.status(400).json({
                message:"All field are reuired"
            })
        }

        const user= await User.findOne({email});
        if(user){
            return res.status(401).json({
                message:"User already exist pls try logging in"
            })
        }
          //agar pasowr hash karna i mean maine pehle hi elk method bana rakah ahi db mai 
        //   const hashedpassword =await bcrypt.hash(password,10 )
        const newUser=await User.create({
            name, email, password   
        })
      
        const token=generateToken(newUser._id);
        newUser.password=undefined;

        return res.status(201).json({message:"User succefully created",
            token,
            user:newUser    
        })
        
    } catch (error) {
       console.log("Failed to register ",error);
       return res.status(400).json({message:error.message})
    }
}

//Controller login
//route POST: /api/users/login

//get details from body 
//findone user 
//comparepasswrd
//return token, nad succes message 

export const loginUser=async(req,res)=>{
    const{email, password}=req.body
    try {
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({Message:"passord or email is wrong entered"})
        }
const isMatch = await user.isPasswordCorrect(password);
if (!isMatch) {
  return res.status(401).json({ message: "Wrong password please try again" });
}
      const token =generateToken(user._id);
      user.password=undefined;
      return res.status(200).json({message:"LOgin succesfull",token,user})
 
    } catch (error) {
              console.error(error);
              return res.status(400).json({message:error.message})
    }
}

//controller to get the userID
//get:  /api/users/data

//get userId from middleware
//check if user exist or not         
//return user 

export const getUserId=async(req,res)=>{
    const userId=req.userId;

    try {
        const user=await User.findById(userId);
        if(!user){
            return res.status(400).json({message:"kindly login or seesion timeout "})
        }
        user.password=undefined;
        return res.status(200).json({message:"Success in getting teh user",user})
    } catch (error) {
        console.log(error.message);
        
        return res.status(400).json({message:"Failed to get the user",message:error.message})
    }
}


//controller for getting user resumes
//get:api/user/resumes

export const getUserResume = async (req, res) => {
    try {
        const userId = req.userId;
        const resumes = await Resume.find({ userId });
        return res.status(200).json({ resumes });
    } catch (error) {
        console.log("Failed to get resumes", error.message);
        return res.status(400).json({ message: "Failed to get User resumes", error: error.message });
    }
};