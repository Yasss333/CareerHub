import { db } from "../libs/db.js";
import {runCodeWithPiston} from "../libs/pistonlibs.js"

const createProblemHandler = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testcases,
      codeSnippets,
      refrenceSolutions,
    } = req.body;

    // Validate reference solutions (best-effort: missing runtimes / errors are tolerated)
    const validationWarnings = [];
    for (const [language, solutionCode] of Object.entries(refrenceSolutions)) {
      if (!solutionCode) continue;
      try {
        for (let i = 0; i < testcases.length; i++) {
          const { input, output } = testcases[i];

          const result = await runCodeWithPiston({
            language,
            sourceCode: solutionCode,
            stdin: input
          });

          if (result.stderr) {
            validationWarnings.push(`${language} testcase ${i + 1}: runtime stderr`);
            break;
          }
          if (result.stdout.trim() !== output.trim()) {
            validationWarnings.push(`${language} testcase ${i + 1}: output mismatch`);
            break;
          }
        }
      } catch (err) {
        validationWarnings.push(`${language}: skipped (${err.message})`);
      }
    }
    if (validationWarnings.length > 0) {
      console.warn("Reference solution warnings:", validationWarnings);
    }

    // Save problem
    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        refrenceSolutions  ,
       user: {
  connect: {
    id: req.user.id, // coming from verifyJWT
  },
},

      }
    });

    return res.status(201).json({
      message: "New Problem Created",
      newProblem
    });

  } catch (err) {
    if (res.headersSent) return;

    console.error(err);
    return res.status(500).json({
      message: "Failed to create Problem",
      error: err.message
    });
  }
};


const getallProblemHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const problems = await db.problem.findMany({
      include: {
        solvedBy: {
          where: {
            userID: req.user.id
          }
        }
      }
    });

    if (problems.length === 0) {
      return res.status(404).json({
        error: "No Problems Found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Problems fetched successfully",
      problems
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get problems",
      error: error.message
    });
  }
};

// const getallProblemHandler = async (req, res) => {
//   try {
//      const userId = req.user?.id;

// const problems = await db.problem.findMany({
//   include: {
//     solvedBy: userId
//       ? {
//           where: { userID: userId }
//         }
//       : false
//   }
// });

//       if(!problems){
//         res.status(404).json({
//           error:"No Problems Found "
//         })
//       }
//       res.status(200).json({
//         sucess:true,
//         message:"Problems Fecthed sucessfully",
//         problems
//       })
//   } catch (error) {
//     console.log(error);
//        return res.status(500).json({
//       message: "Failed to Get All problems  Problem",
//       error: error.message
//     });
//   }
// };
const getProblemByIDHandler = async (req, res) => {
  const {id}=req.params;
  try {
    const problem= await db.problem.findUnique({
      where:{
        id
      }
    });
    if(!problem){
      return res.status(404).json({
        message:"This Problem does not exist"
      })
    }
     res.status(200).json({
        sucess:true,
        message:"Problems Fecthed sucessfully",
        problem
      })
  } catch (error) {
     console.log(error);
       return res.status(500).json({
      message: "Failed to Get All problems  Problem",
      error: error.message
    });
  }
};
const   updateProblemByIDHandler = async (req, res) => {
  const {id}=req.params;
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testcases,
      codeSnippets,
      refrenceSolutions  ,
    } = req.body;
  
  try {
     const updatedProblem=await db.problem.update({
      where:{
        id
      },
        data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        refrenceSolutions  
}  });
console.log("Updated  Problem :" +updatedProblem );


   return res.status(200).json({
    message:"Problem Updated succesfully",
    updatedProblem
   })
  } catch (error) {
      if (error.code === "P2025") {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    console.log(error);
    return res.status(400).json({
      error:error.message
    })
  }
};
const deleteProblemByIDHandler = async (req, res) => {
  const {id}=req.params;
  try {
    const deletedProblem=await db.problem.delete({
      where:{
        id
      }
    });
    if(!deletedProblem){
      return res.status(400).json({
        message:"Failed to delete the problem"
      })
    }

    return res.status(200).json({
      message:"Problem deleted Succesfully",
     DeletedProblem:deletedProblem
    })
  } catch (error) {
      console.log(error);
    return res.status(400).json({
      error,
      error:error.message
    })
  }
};
const getSolvedProblemByUserHandler = async (req, res) => {
  try {
    const problems = await db.problem.findMany({
      where: {
        solvedBy: {
          some: {
            userID: req.user.id,
          },
        },
      },
      // this include below is used to add details to thei sproblem as postgress by default does 
      // not add details 
      include: {
        solvedBy: true
      },
    });
    // if (problems.length == 0) {
    //   return res.status(400).json({
    //     message: "This user has no Problems Created",
    //   });
    // }
    return res.status(200).json({
      message: "Problems Displayed",
      problems,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Failed to get the problems for thsi user",
      error: error.message,
    });
  }
};

export {
  createProblemHandler,
  getallProblemHandler,
  getProblemByIDHandler,
  deleteProblemByIDHandler,
  getSolvedProblemByUserHandler,
  updateProblemByIDHandler,
};


/////------->>> Following is the code for judge0<<<<<<------//////

// import {
//   getJudge0LanguageId,
//   submitBatch,
//   pollBatchResults,
// } from "../libs/judge0.libs.js";

/**
 * Wrap JavaScript code so Judge0 can execute it
 */
// const wrapJavaScriptCode = (userCode) => `
// process.stdin.resume();
// process.stdin.setEncoding("utf8");

// let input = "";
// process.stdin.on("data", chunk => input += chunk);
// process.stdin.on("end", () => {
//   ${userCode}
//   if (typeof solve === "function") {
//     solve(input);
//   }
// });
// `;


// const createProblemHandler = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       difficulty,
//       tags,
//       examples,
//       constraints,
//       testcases,
//       codeSnippets,
//       refrenceSolutions  ,
//     } = req.body;

//     // 1️⃣ Validate reference solutions using Judge0
//     for (const [language, solutionCode] of Object.entries(refrenceSolutions  )) {
//       const languageId = getJudge0LanguageId(language);

//       if (!languageId) {
//         return res.status(400).json({
//           error: `Unsupported language: ${language}`,
//         });
//       }

//       const submissions = testcases.map(({ input, output }) => ({
//         source_code: solutionCode,
//         language_id: languageId,
//         stdin: input,
//         expected_output: output.endsWith("\n") ? output : output + "\n",
//       }));

//       // 2️⃣ Submit batch
//       const submissionResults = await submitBatch(submissions);
//       const tokens = submissionResults.map((s) => s.token);
//         console.log("Tokens:", tokens);

//       // 3️⃣ Poll results (with timeout protection)
//       const results = await pollBatchResults(tokens);

//       // 4️⃣ Validate verdicts
//       for (let i = 0; i < results.length; i++) {
//         if (results[i].status.id !== 3) {
//           return res.status(400).json({
//             error: `Reference solution failed for ${language} on testcase ${
//               i + 1
//             }`,
//             judge0Status: results[i].status,
//           });
//         }
//       }
//     }

//     // 5️⃣ All reference solutions passed → create problem
//     const newProblem = await db.problem.create({
//       data: {
//         title,
//         description,
//         difficulty,
//         tags,
//         examples,
//         constraints,
//         testcases,
//         codeSnippets,
//         refrenceSolutions  ,
//         userId: "TEST_ADMIN_ID", // replace with req.user.id later
//       },
//     });

//     return res.status(201).json({
//       message: "New Problem Created",
//       newProblem,
//     });
//   } catch (err) {
//     console.error("Create Problem Error:", err.response?.data || err);

//     return res.status(500).json({
//       message: "Failed to create Problem",
//       error: err.response?.data || err.message,
//     });
//   }
// };

// Get problems by tags and filters
export const getProblemsByTags = async (req, res) => {
  try {
    const { tags, difficulty, search } = req.query;
    const userId = req.user?.id;

    // Build filter object
    const where = {};

    // Filter by difficulty
    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    // Filter by tags (match any tag)
    if (tags) {
      const tagArray = tags.split(",").map(tag => tag.trim());
      where.tags = {
        hasSome: tagArray
      };
    }

    // Filter by search term in title or description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const problems = await db.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        tags: true,
        createdAt: true,
        solvedBy: userId ? {
          where: { userID: userId },
          select: { id: true }
        } : false
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({
      success: true,
      message: "Problems fetched successfully",
      count: problems.length,
      problems: problems.map(p => ({
        ...p,
        isSolved: p.solvedBy?.length > 0 || false,
        solvedBy: undefined
      }))
    });
  } catch (error) {
    console.error("Error fetching problems by tags:", error);
    res.status(500).json({
      message: "Failed to fetch problems",
      error: error.message
    });
  }
};

// Get all unique tags
export const getAllTags = async (req, res) => {
  try {
    const problems = await db.problem.findMany({
      select: { tags: true }
    });

    const uniqueTags = new Set();
    problems.forEach(p => {
      p.tags?.forEach(tag => uniqueTags.add(tag));
    });

    const tagStats = {};
    problems.forEach(p => {
      p.tags?.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    });

    const tags = Array.from(uniqueTags).sort().map(tag => ({
      name: tag,
      count: tagStats[tag]
    }));

    res.status(200).json({
      success: true,
      message: "Tags fetched successfully",
      tags,
      totalTags: tags.length
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({
      message: "Failed to fetch tags",
      error: error.message
    });
  }
};