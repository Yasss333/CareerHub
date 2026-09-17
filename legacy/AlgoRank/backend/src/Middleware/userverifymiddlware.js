// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../libs/db.js";

// export const verfiyJWT = async (req, res, next) => {
//   const token = req.cookies.jwt;
//   // console.log("Token : ", token);
//     if (!token) {
//     req.user = null;
//     return next();
//   }
  
//   let decoded;
//   try {
//     decoded = await jwt.verify(token , process.env.SECRET);
//     if (!decoded) {
//       res.status(400).json({
//         message: "Wrong credentials",
//       });
//     }

//     const user = await db.user.findUnique({
//       where: {
//         id: decoded.id,
//       },
//       select:{
//         id:true,
//         name:true,
//         password:false,        
//       }
//     });
//     if(!user){
//         res.status(400).json({
//           message: "Wrong credentials",
//         });
//     }
//      req.user=user;
//     next(); 
//   } catch (error) {
//     console.error(error);
//       res.status(400).json({
//         message: "JWT middlewared stopped teh execution ",error,
//       });
//   }
// };

//updated bexasue check ask for jwt before login 
export const verfiyJWT = async (req, res, next) => {
  // Check for token in cookie first, then in Authorization header
  let token = req.cookies.jwt;
  
  // If no cookie, check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // ✅ IMPORTANT: allow request to continue
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT error:", error.message);

    // ✅ DO NOT RESPOND
    req.user = null;
    next();
  }
};


export const validateAdmin=(async(req,res,next)=>{
      if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
     }
       const userID=req.user.id;
      //  console.log(userID);
      try {
         const user=await db.user.findUnique({
          where:{
            id:userID
          },
          select:{
            role:true
          }
         })
         if(!user || user.role!=="ADMIN"){
          res.status(403).json({
            message:"Admin only Forbiden -this route is not acesible to you"
          })
          
         }
          // res.status(200).json({
          //   message:"Access GIVEn"
          //  })
          next();
      } catch (error) {
        console.error("Role check ",error)
          res.status(400).json({
            message:"Error valdating role", error
          })
      }
       
})  