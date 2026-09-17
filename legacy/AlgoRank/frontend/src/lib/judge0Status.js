/**
 * Judge0 status ID to description mapping
 * Reference: https://judge0.com/submissions/#status-codes
 */

export const JUDGE0_STATUS = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error",
  8: "Memory Limit Exceeded",
  9: "Internal Error",
  10: "Executed Successfully",
  11: "Output Limit Exceeded",
  12: "Presentation Error"
};

/**
 * Get status description from Judge0 status ID
 * @param {number} statusId - Judge0 status ID
 * @return {string} - Status description
 */
export const getStatusDescription = (statusId) => {
  return JUDGE0_STATUS[statusId] || "Unknown Status";
};

/**
 * Check if status indicates successful execution
 * @param {number} statusId - Judge0 status ID
 * @return {boolean} - Whether execution was successful
 */
export const isSuccessfulExecution = (statusId) => {
  return statusId === 3 || statusId === 10; // Accepted or Executed Successfully
};

/**
 * Check if status indicates an error
 * @param {number} statusId - Judge0 status ID
 * @return {boolean} - Whether execution had an error
 */
export const isErrorStatus = (statusId) => {
  return [4, 5, 6, 7, 8, 9, 11, 12].includes(statusId);
};

/**
 * Check if status is still processing
 * @param {number} statusId - Judge0 status ID
 * @return {boolean} - Whether execution is still in progress
 */
export const isProcessingStatus = (statusId) => {
  return [1, 2].includes(statusId);
};

/**
 * Get user-friendly error message for status
 * @param {number} statusId - Judge0 status ID
 * @return {string} - User-friendly error message
 */
export const getErrorMessage = (statusId) => {
  const errorMessages = {
    4: "Your output doesn't match the expected output.",
    5: "Your solution took too long to execute.",
    6: "Your code failed to compile. Check for syntax errors.",
    7: "Your code encountered a runtime error during execution.",
    8: "Your solution used too much memory.",
    9: "An internal error occurred. Please try again.",
    11: "Your solution produced too much output.",
    12: "Your solution produced output in the wrong format."
  };
  
  return errorMessages[statusId] || "An error occurred during execution.";
};

/**
 * Get status color for UI display
 * @param {number} statusId - Judge0 status ID
 * @return {string} - Tailwind color class
 */
export const getStatusColor = (statusId) => {
  const colorMap = {
    1: "gray", // In Queue
    2: "yellow", // Processing
    3: "green", // Accepted
    4: "red", // Wrong Answer
    5: "orange", // Time Limit Exceeded
    6: "purple", // Compilation Error
    7: "red", // Runtime Error
    8: "orange", // Memory Limit Exceeded
    9: "red", // Internal Error
    10: "blue", // Executed Successfully
    11: "orange", // Output Limit Exceeded
    12: "yellow" // Presentation Error
  };
  
  return colorMap[statusId] || "gray";
};