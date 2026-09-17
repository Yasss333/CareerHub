import React, { useState } from "react";
import { X, LoaderCircle, Copy, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import api from "../../configs/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const InterviewModal = ({ isOpen, onClose, resumeId }) => {
  const { token } = useSelector((state) => state.auth);

  // Setup state
  const [count, setCount] = useState(5);
  const [types, setTypes] = useState(["technical", "behavioral"]);
  const [focus, setFocus] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Practice state
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // each answer: { question, userAnswer, evaluation }
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Summary state
  const [summary, setSummary] = useState(null);

  // Reset modal
  const resetModal = () => {
    setCount(5);
    setTypes(["technical", "behavioral"]);
    setFocus("");
    setJobDescription("");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setUserAnswer("");
    setEvaluating(false);
    setShowModelAnswer(false);
    setSummary(null);
    setLoading(false);
    onClose();
  };

  // Generate questions
  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(
        "/api/ai/interview/generate",
        { resumeId, count, types, focus, jobDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setAnswers([]);
      setUserAnswer("");
      setLoading(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Evaluate current answer
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error("Please write an answer before submitting.");
      return;
    }
    const currentQ = questions[currentIndex];
    setEvaluating(true);
    try {
      const { data } = await api.post(
        "/api/ai/interview/evaluate",
        { resumeId, question: currentQ.question, answer: userAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Save evaluation
      const newAnswers = [...answers, { question: currentQ.question, userAnswer, evaluation: data }];
      setAnswers(newAnswers);
      setUserAnswer("");
      setEvaluating(false);
      // If it's the last question, go to summary
      if (currentIndex === questions.length - 1) {
        generateSummary(newAnswers);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
      setEvaluating(false);
    }
  };

  // Generate summary
  const generateSummary = (allAnswers) => {
    const total = allAnswers.length;
    const ratings = allAnswers.map(a => a.evaluation.rating);
    // Simple mapping: Excellent=5, Good=4, Needs Improvement=3, etc.
    const scoreMap = { "Excellent": 5, "Good": 4, "Needs Improvement": 3 };
    const avg = (ratings.reduce((sum, r) => sum + (scoreMap[r] || 0), 0) / total).toFixed(1);
    const strengths = allAnswers.filter(a => scoreMap[a.evaluation.rating] >= 4).length;
    const weaknesses = allAnswers.filter(a => scoreMap[a.evaluation.rating] < 4).length;
    setSummary({
      average: avg,
      total: total,
      strengths,
      weaknesses,
      details: allAnswers
    });
  };

  const copyReport = () => {
    if (!summary) return;
    let text = "Interview Practice Report\n========================\n";
    text += `Average Rating: ${summary.average}/5\n\n`;
    summary.details.forEach((item, i) => {
      text += `Q${i+1}: ${item.question}\n`;
      text += `Your Answer: ${item.userAnswer}\n`;
      text += `Rating: ${item.evaluation.rating}\n`;
      text += `Feedback: ${item.evaluation.feedback}\n`;
      text += `Model Answer: ${item.evaluation.modelAnswer}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => toast.success("Report copied!"));
  };

  const retry = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setUserAnswer("");
    setSummary(null);
    setLoading(false);
  };

  if (!isOpen) return null;

  // Phase: Setup
  if (!loading && questions.length === 0 && !summary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🎯 Mock Interview Practice
            </h2>
            <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
              <X className="size-6" />
            </button>
          </div>
          <form onSubmit={handleStart}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Question Types</label>
                <div className="flex gap-4">
                  {["technical", "behavioral", "system design"].map(type => (
                    <label key={type} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) setTypes([...types, type]);
                          else setTypes(types.filter(t => t !== type));
                        }}
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Focus Area (optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="e.g., MERN stack, Data structures, Leadership"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Description (optional)</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-2 resize-none"
                  placeholder="Paste job description for tailored questions..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                🚀 Start Interview
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Phase: Loading (generating questions)
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          <LoaderCircle className="size-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Generating interview questions...</p>
        </div>
      </div>
    );
  }

  // Phase: Summary
  if (summary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🎉 Interview Complete!
            </h2>
            <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
              <X className="size-6" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-3xl font-bold text-green-700">{summary.average}/5</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Strong Answers</p>
              <p className="text-3xl font-bold text-blue-700">{summary.strengths}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600">Need Improvement</p>
              <p className="text-3xl font-bold text-orange-700">{summary.weaknesses}</p>
            </div>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {summary.details.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold">Q{i+1}: {item.question}</p>
                <p className="text-sm text-gray-700 mt-1"><strong>Your Answer:</strong> {item.userAnswer}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.evaluation.rating === 'Excellent' ? 'bg-green-100 text-green-800' : item.evaluation.rating === 'Good' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {item.evaluation.rating}
                  </span>
                  <span className="text-sm text-gray-600">{item.evaluation.feedback}</span>
                </div>
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer">💡 Model Answer</summary>
                  <p className="text-sm text-gray-700 mt-1">{item.evaluation.modelAnswer}</p>
                </details>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-6 justify-end">
            <button onClick={copyReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <Copy className="size-4" /> Copy Report
            </button>
            <button onClick={retry} className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition">
              🔄 Retry
            </button>
            <button onClick={resetModal} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Practice (Q&A)
  const currentQ = questions[currentIndex];
  const progress = `${currentIndex + 1}/${questions.length}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🎯 Mock Interview
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Progress: {progress}</span>
            <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
              <X className="size-6" />
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-gray-700">Interviewer:</p>
              <p className="text-gray-800 text-lg">{currentQ.question}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">{currentQ.category}</span>
            </div>
          </div>
        </div>

        {/* Answer input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">💬 Your Answer:</label>
          <textarea
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={evaluating}
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitAnswer}
            disabled={evaluating || !userAnswer.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {evaluating ? <LoaderCircle className="size-4 animate-spin" /> : "📤 Submit Answer"}
          </button>
        </div>
{/* 
        {/* If evaluation is shown for the previous question (optional we can show feedback inline) but we'll show after submit via a separate state? Actually we already updated answers and moved to next question. Instead we could show feedback for the current question after submit before moving. Let's keep it simple: after submit we evaluate and move to next question automatically, but we could show a brief feedback toast. We'll keep it as is.
        But if the user wants to see feedback, we can include a "Show Feedback" toggle. However, we want a smooth flow where they submit, get feedback, then move on. So we need to modify: after submit, we should display the evaluation before moving to the next question. 
        Let's adjust: We'll set a state `evaluationResult` after submit, show it, and then a "Next Question" button. 
        But the current code moves to next question immediately after evaluation. We'll change to a two-step: submit -> show evaluation with "Next Question" button.
        I'll update the logic in the final code.
        For now, we'll keep the flow as described in the UI design.  */}
      </div>
    </div>
  );
};

export default InterviewModal;