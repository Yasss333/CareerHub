import React, { useState } from "react";
import { X, LoaderCircle, Copy, CheckCircle } from "lucide-react";
import api from "../../configs/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const ATSModal = ({ isOpen, onClose, resumeId }) => {
  const { token } = useSelector((state) => state.auth);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(
        "/api/ai/ats-score",
        { resumeId, jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!result) return;
    const report = `
ATS Score: ${result.score}%
Present Keywords: ${result.keywordMatch?.present?.join(", ") || "None"}
Missing Keywords: ${result.keywordMatch?.missing?.join(", ") || "None"}
Suggestions:
${result.suggestions?.map((s, i) => `${i+1}. ${s}`).join("\n")}
    `;
    navigator.clipboard.writeText(report);
    toast.success("Report copied to clipboard");
  };

  const resetModal = () => {
    setJobDescription("");
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🎯 ATS Resume Scanner
          </h2>
          <button
            onClick={resetModal}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Phase 1: Input */}
        {!loading && !result && (
          <form onSubmit={handleAnalyze}>
            <p className="text-sm text-gray-600 mb-3">
              Paste the job description below to see how well your resume matches.
            </p>
            <textarea
              rows={8}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
              >
                <span>🔍 Analyze Match</span>
              </button>
            </div>
          </form>
        )}

        {/* Phase 2: Loading */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <LoaderCircle className="size-12 text-blue-500 animate-spin" />
            <p className="mt-4 text-gray-600 font-medium">Analyzing your resume...</p>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
            <div className="w-full max-w-xs mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "70%" }}></div>
            </div>
          </div>
        )}

        {/* Phase 3: Results */}
        {result && !loading && (
          <div>
            {/* Score + Keyword Match */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Score Circle */}
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={
                        result.score >= 70 ? "#10b981" :
                        result.score >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${result.score}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">{result.score}%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 font-medium">
                  {result.score >= 70 ? "✅ Strong Match" :
                   result.score >= 50 ? "📈 Good, but can improve" : "⚠️ Needs work"}
                </p>
              </div>

              {/* Keyword Match */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🏷️ Keyword Match</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-green-700">✅ Found ({result.keywordMatch?.present?.length || 0})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(result.keywordMatch?.present || []).map((kw, i) => (
                        <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {kw}
                        </span>
                      ))}
                      {result.keywordMatch?.present?.length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">❌ Missing ({result.keywordMatch?.missing?.length || 0})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(result.keywordMatch?.missing || []).map((kw, i) => (
                        <span key={i} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {kw}
                        </span>
                      ))}
                      {result.keywordMatch?.missing?.length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Suggestions to Improve</h3>
              <ul className="space-y-2 text-sm text-blue-700 list-disc list-inside">
                {(result.suggestions || []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
                {result.suggestions?.length === 0 && (
                  <li>No suggestions – your resume looks great!</li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={copyReport}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
              >
                <Copy className="size-4" />
                Copy Report
              </button>
              <button
                onClick={() => { setResult(null); setJobDescription(""); }}
                className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-sm"
              >
                <span>↻</span> New Scan
              </button>
              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSModal;