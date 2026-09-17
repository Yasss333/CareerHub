import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MemoryStick as Memory,
  Terminal
} from "lucide-react";
import { getStatusDescription, getErrorMessage } from "../lib/judge0Status";

const SubmissionResults = ({ submission }) => {
  if (!submission) return null;

  /* ---------------------------
     Normalize incoming data
  ---------------------------- */

  // Handle both testCases (old format) and testCaseResults (new Judge0 format)
  const testCases = Array.isArray(submission.testCases)
    ? submission.testCases
    : Array.isArray(submission.testCaseResults)
    ? submission.testCaseResults
    : [];

  const hasTestCases = testCases.length > 0;

  const status = submission.status || "Executed";
  
  // Handle Judge0 status if present
  const statusId = submission.statusId || submission.status?.id;
  const statusDescription = statusId ? getStatusDescription(statusId) : status;
  const errorMessage = statusId ? getErrorMessage(statusId) : null;
  const stdout = submission.stdout || "";
  const stderr = submission.stderr || "";

  /* ---------------------------
     Memory & Time (Judge-style)
     Safe parsing
  ---------------------------- */

  const memoryArr = (() => {
    try {
      return JSON.parse(submission.memory || "[]");
    } catch {
      return [];
    }
  })();

  const timeArr = (() => {
    try {
      return JSON.parse(submission.time || "[]");
    } catch {
      return [];
    }
  })();

  const avgMemory =
    memoryArr.length > 0
      ? memoryArr.map(m => parseFloat(m)).reduce((a, b) => a + b, 0) /
        memoryArr.length
      : null;

  const avgTime =
    timeArr.length > 0
      ? timeArr.map(t => parseFloat(t)).reduce((a, b) => a + b, 0) /
        timeArr.length
      : null;

  const successRate = hasTestCases
    ? ((testCases.filter(tc => tc.passed).length / testCases.length) * 100)
    : 100;

  /* ---------------------------
     UI
  ---------------------------- */

  return (
    <div className="space-y-6">

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm">Status</h3>
            <div
              className={`text-lg font-bold ${
                status === "Accepted" || statusId === 3 ? "text-success" : "text-warning"
              }`}
            >
              {statusDescription}
            </div>
            {errorMessage && (
              <div className="text-xs text-base-content/60 mt-1">{errorMessage}</div>
            )}
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm">Success Rate</h3>
            <div className="text-lg font-bold">
              {successRate.toFixed(1)} %
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg. Runtime
            </h3>
            <div className="text-lg font-bold">
              {avgTime !== null ? `${avgTime.toFixed(3)} s` : "N/A"}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="card-title text-sm flex items-center gap-2">
              <Memory className="w-4 h-4" />
              Avg. Memory
            </h3>
            <div className="text-lg font-bold">
              {avgMemory !== null ? `${avgMemory.toFixed(0)} KB` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------
          RUN CODE (PISTON)
      ---------------------------- */}
      {!hasTestCases && (
        <div className="space-y-4">
          {/* Exit Code Status */}
          {submission.exitCode !== undefined && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  {submission.exitCode === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">Program executed successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-error" />
                      <span className="font-semibold text-error">Program exited with code {submission.exitCode}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Output */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5" />
                Program Output
              </h2>

              {stdout ? (
                <div className="bg-base-200 rounded-lg p-4 font-mono whitespace-pre-wrap text-sm border border-base-content/10">
                  <div className="text-xs text-base-content/50 mb-2 font-semibold">STDOUT:</div>
                  <div className="text-base-content">{stdout}</div>
                </div>
              ) : (
                <div className="bg-base-200 rounded-lg p-4 font-mono text-sm text-base-content/50 italic border border-base-content/10">
                  No output
                </div>
              )}

              {stderr && (
                <div className="mt-4">
                  <div className="text-xs text-error mb-2 font-semibold">STDERR:</div>
                  <div className="bg-error/10 border border-error/20 rounded-lg p-4 font-mono text-sm text-error whitespace-pre-wrap">
                    {stderr}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------
          SUBMIT (JUDGE STYLE)
      ---------------------------- */}
      {hasTestCases && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Test Case Results</h2>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Expected</th>
                    <th>Your Output</th>
                    <th>Memory</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc, idx) => (
                    <tr key={idx}>
                      <td>
                        {tc.passed ? (
                          <span className="flex items-center gap-2 text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            Passed
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-error">
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-sm">{tc.expected || "N/A"}</td>
                      <td className="font-mono text-sm">{tc.stdout || "N/A"}</td>
                      <td className="text-sm">{tc.memory || "N/A"}</td>
                      <td className="text-sm">{tc.time || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionResults;
