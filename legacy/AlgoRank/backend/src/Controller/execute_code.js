import { db } from "../libs/db.js";
import { updateUserRankingStats } from "../utils/rankingUtils.js";
import { safeRunCodeWithPiston } from "../libs/pistonlibs.js";
import { buildRunnable } from "../libs/codeHarness.js";


// controllers/execute_code.js
// the below code is just a dry run prcess no db writes done , it is like run over testcases 
export const executionRouter = async (req, res) => {
  const { sourceCode, languageKey, stdin } = req.body;
     console.log("REQ.BODY:", req.body);
  console.log("REQ.USER:", req.user);
  try {
    if (!sourceCode || !languageKey) {
      return res.status(400).json({
        message: "Missing source code or language",
      });
    }

    const runnable = buildRunnable({ language: languageKey.toUpperCase(), sourceCode });
    if (!runnable.ok) {
      return res.status(400).json({ message: runnable.reason });
    }

    // Run code against the self-hosted Piston API
    const result = await safeRunCodeWithPiston({
      language: languageKey,
      sourceCode: runnable.source,
      stdin: stdin || ""
    });

    const success = result.exitCode === 0;
    const memKB = typeof result.memory === "number" && result.memory >= 0 ? (result.memory / 1024).toFixed(2) : null;
    const timeSec = typeof result.cpuTime === "number" && result.cpuTime >= 0 ? (result.cpuTime / 1000).toFixed(3) : null;

    return res.status(200).json({
      success: true,
      result: {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode,
        status: {
          id: success ? 3 : 11,
          description: success ? "Accepted" : "Runtime Error"
        },
        memory: memKB !== null ? memKB : null,
        time: timeSec !== null ? timeSec : null
      },
    });
  } catch (error) {
    console.error("Execution error:", error);
    return res.status(500).json({
      message: "Execution failed",
      error: error.message,
    });
  }
};

// Submit code and save to database
export const submitCodeHandler = async (req, res) => {
  const { sourceCode, languageKey, stdin, problemId, expectedOutputs, testcases } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required. Please log in to submit code." });
  }
  const userID = req.user.id;

  console.log("SUBMIT REQ.BODY:", req.body);
  console.log("SUBMIT REQ.USER:", req.user);

  try {
    if (!sourceCode || !languageKey || !problemId) {
      return res.status(400).json({
        message: "Missing source code, language, or problemId",
      });
    }

    const langKey = String(languageKey || "").toUpperCase();

    // Build the list of test cases from the structured `testcases` array when
    // available, otherwise fall back to the legacy flattened stdin/expectedOutputs.
    const cases = Array.isArray(testcases) && testcases.length > 0
      ? testcases.map(tc => ({ input: tc?.input ?? "", expected: String(tc?.output ?? "").trim() }))
      : (stdin ? stdin.split("\n").filter(s => s.trim() !== "") : [])
          .map((input, i) => ({ input, expected: String(expectedOutputs?.[i] ?? "").trim() }));

    let allPassed = true;
    let memory = [];
    let time = [];
    let testCaseResults = [];

    // Wrap the user's solution so it reads stdin and prints a result (gradable).
    const runnable = buildRunnable({ language: langKey, sourceCode });
    if (!runnable.ok) {
      return res.status(400).json({ message: runnable.reason });
    }
    const runnableSource = runnable.source;

    for (let i = 0; i < cases.length; i++) {
      const { input, expected } = cases[i];

      let result;
      try {
        result = await safeRunCodeWithPiston({
          language: langKey,
          sourceCode: runnableSource,
          stdin: input
        });
      } catch (err) {
        testCaseResults.push({
          testCase: i + 1,
          passed: false,
          stdout: "",
          expected,
          stderr: err.message || String(err),
          status: "Piston Error",
          memory: "",
          time: "",
        });
        allPassed = false;
        continue;
      }

      const passed = result.exitCode === 0 && (result.stdout || "").trim() === expected;

      // Piston returns memory in bytes and cpu_time/wall_time in milliseconds.
      const memKB = typeof result.memory === "number" && result.memory >= 0 ? (result.memory / 1024).toFixed(2) : null;
      const timeSec = typeof result.cpuTime === "number" && result.cpuTime >= 0 ? (result.cpuTime / 1000).toFixed(3) : null;

      testCaseResults.push({
        testCase: i + 1,
        passed,
        stdout: result.stdout || "",
        expected,
        stderr: result.stderr || "",
        status: result.exitCode === 0 ? "Accepted" : "Runtime Error",
        memory: memKB !== null ? memKB : "",
        time: timeSec !== null ? timeSec : "",
      });

      if (memKB !== null) memory.push(memKB);
      if (timeSec !== null) time.push(timeSec);
      if (!passed) allPassed = false;
    }

    // Create submission in database
    const submission = await db.submission.create({
      data: {
        userID,
        problemID: problemId,
        sourceCode,
        language: languageKey,
        stdin: (stdin || cases.map(c => c.input).join("\n")) || "",
        stdout: JSON.stringify(testCaseResults.map(r => r.stdout)),
        stderr: testCaseResults.some(r => r.stderr) 
          ? JSON.stringify(testCaseResults.map(r => r.stderr))
          : null,
        status: allPassed ? "Accepted" : "Wrong Answer",
        memory: memory.length > 0 ? JSON.stringify(memory) : "[]",
        time: time.length > 0 ? JSON.stringify(time) : "[]",
      },
    });

    // Mark problem as solved if all tests passed
    if (allPassed) {
      await db.problemSolved.upsert({
        where: {
          userID_problemID: {
            userID,
            problemID: problemId,
          },
        },
        update: {},
        create: {
          userID,
          problemID: problemId,
        },
      });

      // Update user ranking statistics after successful submission
      await updateUserRankingStats(userID);
    }

    // Get the created submission with any related data
    const finalSubmission = await db.submission.findUnique({
      where: { id: submission.id },
    });

    return res.status(200).json({
      success: true,
      message: "Code submitted successfully",
      submission: finalSubmission,
      testCaseResults,
    });
  } catch (error) {
    console.error("Submit error:", error);
    // If it's an axios-like error propagated earlier, include details
    const status = error.status || 500;
    return res.status(status).json({
      message: "Submission failed",
      error: error.message || String(error),
    });
  }
};



// export const executionRouter = async (req, res) => {
//   const {
//     source_code,
//     langauge_id, // "PYTHON" | "JAVASCRIPT" | "CPP"
//     stdin,
//     expected_outputs,
//     problemID,
//   } = req.body;

//   const userID = req.user.id;

//   try {
//     // 1️⃣ Validate testcases
//     if (
//       !Array.isArray(stdin) ||
//       stdin.length === 0 ||
//       !Array.isArray(expected_outputs) ||
//       expected_outputs.length !== stdin.length
//     ) {
//       return res.status(400).json({
//         message: "Invalid or missing testcases",  
//       });
//     }

//     const executions = [];

//     for (let i = 0; i < stdin.length; i++) {
//       const result = await runCodeWithPiston({
//         language: langauge_id,
//         sourceCode: source_code,
//         stdin: stdin[i],
//       });

//       executions.push(result);
//     }

//     let ispassed = true;
//     // 3️⃣ Judge results
//     const results = executions.map((result, index) => {
//       const actual = result.stdout?.trim();
//       const expected = expected_outputs[index]?.trim();

//       let ispassed = actual === expected;
//       if (!ispassed) ispassed = false;
//       //  console.log(`Testcases #${index+1}`);
//       //  console.log(`Input for testcase ${stdin[index]}`);
//       //  console.log(`Ouput executed By Piston API : ${actual}`)
//       //  console.log(`REal REsult ${expected}`);
//       //  console.log("Result : ", actual===expected);

//       return {
//         testCase: index + 1,
//         passed: ispassed,
//         input: stdin[index],
//         stdout: result.stdout,
//         expected: expected,
//         stderr: result.stderr || null,
//         compileOutput: result.compileOutput || null,
//         status: result.status,
//         memory: result.memory ? `${result.memory} kb` : undefined,
//         time: result.time ? `${result.time}seconds` : undefined,
//         exitCode: result.exitCode,
//       };
//     });

//     // console.log(results);
//     //Storing in the DB
//     const submission = await db.submission.create({
//       data: {
//         userID,
//         problemID,
//         userID,

//         sourceCode: source_code,
//         // language:getLangaugeName(langauge_id)
//         language: langauge_id,
//         stdin: stdin.join("\n"),
//         stdout: JSON.stringify(
//           results.map((r) => {
//             r.actual;
//           })
//         ),
//         stderr: results.some((r) => r.stderr)
//           ? JSON.stringify(results.map((r) => r.stderr))
//           : null,
//         compileOutput: results.some((r) => r.compileOutput)
//           ? JSON.stringify(results.map((r) => r.compileOutput))
//           : null,
//         status: ispassed ? "Accepted " : "Wrong Answer",

//         memory: results.some((r) => r.memory)
//           ? JSON.stringify(results.map((r) => r.memory))
//           : "Not available rn",
//         time: results.some((r) => r.time)
//           ? JSON.stringify(results.map((r) => r.time))
//           : "Not available rn"
//       },
//     });
//     //Marking Completed for User if passed
//     if (ispassed) {
//       await db.problemSolved.upsert({
//         where: {
//           userID_problemID: {
//             userID,
//             problemID,
//           },
//         },
//         update: {},
//         create: {
//           userID,
//           problemID,
//         },
//       });
//     }
//     //saving indiviudal testcases

//     const testCaseResults = results.map((result) => ({
//       submissionID: submission.id,
//       testCase: result.testCase,
//       passed: result.passed,
//       stdout: result.stdout,
//       expected: result.expected,
//       stderr: result.stderr,
//       compileOutput: result.compileOutput,
//       status: result.status,
//       memory: result.memory,
//       time: result.time,
//     }));
//     //store in db 
//     await db.testcases.createMany({
//       data:
//         testCaseResults
      
//     })
//     //for frontend display
//     const submissionWithTestcases=await db.submission.findUnique({
//       where:{
//         id:submission.id
//       },
//       include:{
//         testcases:true
//       }
//     })

//     return res.status(200).json({
//       success:true,
//       message: "Code executed ! Successfully",
//       submission:submissionWithTestcases
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "Execution failed",
//       error: error.message,
//     });
//   }
// };
