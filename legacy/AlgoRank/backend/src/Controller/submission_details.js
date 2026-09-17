
import { db } from "../libs/db.js"
export  const  getallsubHandler=async (req, res)=>{
    const userID=req.user.id;
    try {
        const user=await db.user.findUnique({
            where:{
                id:userID
            }
        })
        if(!user){
            return res.status(400).json({
                message:"No Such User Exist"
            })
        }

        const submission= await db.submission.findMany({
            where:{
                userID
            }
        });
        if(!submission){
            return res.status(201).json({
                message:"No Current Submission"
            })
        }
        return res.status(200).json({
            success:true,
            submissions:submission
        })
    } catch (error) {
    console.error(error);
     return res.status(400).json({
        message:'Failed to get all submissions',
        error:error.message
     })
    
    }
}


export const getsubmissionByIDHandler=async (req,res)=>{
          const {problemID}=req.params;
          const userID=req.user.id ;
        //   console.log(problemID);
          
          try {
            // const problem=await db.problem.findUnique({
            //     where:{
            //         id:problemID
            //     }
            // })
            // if(!problem ){
            //     return res.status(400).json({
            //         message:"No such Problem Exist or no Submissons yet "
            //     })
            // }

            const submissionsofProblem=await db.submission.findMany({
                where:{
                    userID:userID,
                    problemID:problemID 
                },
                orderBy: {
                    createdAt: "desc"
                },
            });
            return res.status(200).json({
                message:"Success in getting Submissions",
                submission:submissionsofProblem,
                submissions:submissionsofProblem
            })
        
          } catch (error) {
             console.error(error);   
     return res.status(400).json({
        message:'Failed to get all submissions',
        error:error.message
     })
          }
}

export const submissionCountHandler =async (req, res)=>{
              const {problemID}=req.params;
          const userID=req.user.id ;
          try {
            const submission=await db.submission.count({
                where:{
                    problemID,
                    userID
                }
            })
            // removed becasue coutn returns a number ex:submission===0
            // if(!submission){
            //     res.status(400).json({
            //         message:"No Submmison for this problem"
            //     })
            // }
            return res.status(200).json({
                count:submission
            })
          } catch (error) {
              console.error(error);   
     return res.status(400).json({
        message:'Failed to get all submissions',
        error:error.message
     })
          }
}