import axios from "axios";

/**
 * Map language names to Judge0 language IDs
 * Updated for Judge0 free tier support
 */
export const getJudge0LanguageId = (language) => {
  const languageMap = {
    PYTHON: 71,
    JAVASCRIPT: 63,
    JAVA: 62,
    CPP: 44,
    C: 46,
    TYPESCRIPT: 74,
    CSHARP: 51,
    PHP: 92,
    RUBY: 72,
    GO: 60,
    RUST: 73,
    KOTLIN: 76,
    SWIFT: 83
  };

  return languageMap[language?.toUpperCase()];
};

/**
 * Get Judge0 API configuration
 */
export const getJudge0Config = () => {
  return {
    baseURL: process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY || "",
      "X-RapidAPI-Host": process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com"
    }
  };
};

/**
 * Sleep helper for polling
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Submit single code to Judge0
 */
export const submitToJudge0 = async ({ sourceCode, languageId, stdin, expectedOutput }) => {
  const config = getJudge0Config();
  
  try {
    const { data } = await axios.post(
      `${config.baseURL}/submissions`,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || "",
        expected_output: expectedOutput ? (expectedOutput + "\n") : null,
        base64_encoded: false
      },
      {
        headers: config.headers
      }
    );

    return data;
  } catch (error) {
    console.error("Judge0 submission failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit batch of solutions to Judge0
 */
export const submitBatch = async (submissions) => {
  const config = getJudge0Config();
  
  try {
    const { data } = await axios.post(
      `${config.baseURL}/submissions/batch`,
      {
        submissions: submissions.map(sub => ({
          source_code: sub.sourceCode,
          language_id: sub.languageId,
          stdin: sub.stdin || "",
          expected_output: sub.expectedOutput ? (sub.expectedOutput + "\n") : null,
          base64_encoded: false
        }))
      },
      {
        headers: config.headers
      }
    );

    return data;
  } catch (error) {
    console.error("Judge0 batch submission failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Poll Judge0 until submission is done
 */
export const pollSubmissionResult = async (token, retries = 25) => {
  if (retries === 0) {
    throw new Error("Judge0 polling timeout");
  }

  const config = getJudge0Config();
  
  try {
    const { data } = await axios.get(
      `${config.baseURL}/submissions/${token}`,
      {
        headers: config.headers,
        params: {
          base64_encoded: false
        }
      }
    );

    // Check if submission is still processing
    if ([1, 2].includes(data.status.id)) {
      await sleep(500); // Wait 500ms before polling again
      return pollSubmissionResult(token, retries - 1);
    }

    return data;
  } catch (error) {
    console.error("Judge0 polling failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Poll Judge0 batch results
 */
export const pollBatchResults = async (tokens, retries = 25) => {
  if (retries === 0) {
    throw new Error("Judge0 batch polling timeout");
  }

  const config = getJudge0Config();
  
  try {
    const { data } = await axios.get(
      `${config.baseURL}/submissions/batch`,
      {
        headers: config.headers,
        params: {
          tokens: tokens.join(","),
          base64_encoded: false
        }
      }
    );

    const results = data.submissions;
    
    // Check if all submissions are done processing
    const isAllDone = results.every((r) => ![1, 2].includes(r.status.id));

    if (!isAllDone) {
      await sleep(500); // Wait 500ms before polling again
      return pollBatchResults(tokens, retries - 1);
    }

    return results;
  } catch (error) {
    console.error("Judge0 batch polling failed:", error.response?.data || error.message);
    throw error;
  }
};


