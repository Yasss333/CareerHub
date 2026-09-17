//get toeknf orm headers 
//validat token 
//get teh decded token by verify jwt 
//atach it to the suer and call next()

import jwt, { decode } from "jsonwebtoken";

const verifyJWT=async(req,res,next)=>{
    try {
       const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Expect: "Bearer token"
    const token = authHeader.split(" ")[1];
        if(!token){
           return  res.status(401).json({message:" you are Unauthorized "})
        }
        
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.userId=decoded.userId;
        
        next();
    } catch (error) {
        console.log(error.message);
        
        res.status(400).json({message:" Failed to verify JWT  "},error)
    }

} 
export default verifyJWT;   