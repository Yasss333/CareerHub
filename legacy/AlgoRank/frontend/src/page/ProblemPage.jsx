import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  FileText,
  MessageSquare,
  Lightbulb,
  Bookmark,
  Share2,
  Clock,
  ChevronRight,
  BookOpen,
  Terminal,
  Code2,
  Users,
  ThumbsUp,
  Home,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useProblemStore } from "../store/useProblemStore";
import { useExecutionStore } from "../store/useExecutionStore";
import { useSubmissionStore } from "../store/useSubmissionStore";
import Submission from "../Components/Submission";
import SubmissionsList from "../Components/SubmissionList";
import { 
  getLanguageDisplayName, 
  getMonacoLanguage, 
  getAllLanguages,
  isLanguageSupported 
} from "../lib/lang";
import { 
  getDefaultCodeTemplate, 
  hasDefaultTemplate 
} from "../lib/defaultCodeTemplates";

const ProblemPage = () => {
  const { id } = useParams();
  const { getProblemById, problem, isProblemLoading } = useProblemStore();

  const {
    submissions,
    isLoading: isSubmissionsLoading,
    getSubmissionForProblem,
    getSubmissionCountForProblem,
    submissionCount,
  } = useSubmissionStore();

  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("JAVASCRIPT");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [testcases, setTestCases] = useState([]);

  const { executeCode, submission, isExecuting, submitCode } = useExecutionStore();

  useEffect(() => {
    getProblemById(id);
    getSubmissionCountForProblem(id);
  }, [id]);

  useEffect(() => {
    if (problem && problem.codeSnippets) {
      // Get code for current language with fallback to default template
      const langKey = selectedLanguage.toUpperCase();
      let codeSnippet = problem.codeSnippets[langKey] || 
                       problem.codeSnippets[selectedLanguage] || 
                       getDefaultCodeTemplate(selectedLanguage);
      
      setCode(codeSnippet);
      
      setTestCases(
        problem.testcases?.map((tc) => ({
          input: tc.input,
          output: tc.output,
        })) || [],
      );
    } else if (problem) {
      // If no code snippets, use default template
      setCode(getDefaultCodeTemplate(selectedLanguage));
      
      setTestCases(
        problem.testcases?.map((tc) => ({
          input: tc.input,
          output: tc.output,
        })) || [],
      );
    }
  }, [problem, selectedLanguage]);

  useEffect(() => {
    if (activeTab === "submissions" && id) {
      getSubmissionForProblem(id);
    }
  }, [activeTab, id, getSubmissionForProblem]);

  console.log("submission", submissions);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    const langKey = lang.toUpperCase();
    
    // Try to get code from problem snippets, otherwise use default template
    let codeSnippet = problem?.codeSnippets?.[langKey] || 
                         problem?.codeSnippets?.[lang] ||
                         getDefaultCodeTemplate(lang);
    
    setCode(codeSnippet);
  };

  //Piston type code runner
  const handleRunCode = (e) => {
    e.preventDefault();

    try {
      const stdin = problem.testcases.map((tc) => tc.input).join("\n");

      executeCode({
        languageKey: selectedLanguage,
        sourceCode: code,
        stdin,
        problemId: id,
      });
    } catch (error) {
      console.error("Error executing code", error);
    }
  };

  // Submit code handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const testcases = problem.testcases.map((tc) => ({
        input: tc.input,
        output: tc.output,
      }));

      await submitCode({
        languageKey: selectedLanguage,
        sourceCode: code,
        problemId: id,
        testcases,
      });

      // Refresh submissions after successful submit
      await getSubmissionForProblem(id);
      await getSubmissionCountForProblem(id);
      
      // Switch to submissions tab to show the new submission
      setActiveTab("submissions");
    } catch (error) {
      console.error("Error submitting code", error);
    }
  };

  if (isProblemLoading || !problem) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-200">
        <div className="card bg-base-100 p-8 shadow-xl">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading problem...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return (
          <div className="prose max-w-none">
            <p className="text-lg mb-6">{problem.description}</p>

            {problem.examples && (
              <>
                <h3 className="text-xl font-bold mb-4">Examples:</h3>
                {Object.entries(problem.examples).map(
                  ([lang, example], idx) => (
                    <div
                      key={lang}
                      className="bg-base-200 p-6 rounded-xl mb-6 font-mono"
                    >
                      <div className="mb-4">
                        <div className="text-indigo-300 mb-2 text-base font-semibold">
                          Input:
                        </div>
                        <span className="bg-black/90 px-4 py-1 rounded-lg font-semibold text-white">
                          {example.input}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="text-indigo-300 mb-2 text-base font-semibold">
                          Output:
                        </div>
                        <span className="bg-black/90 px-4 py-1 rounded-lg font-semibold text-white">
                          {example.output}
                        </span>
                      </div>
                      {example.explanation && (
                        <div>
                          <div className="text-emerald-300 mb-2 text-base font-semibold">
                            Explanation:
                          </div>
                          <p className="text-base-content/70 text-lg font-sem">
                            {example.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </>
            )}

            {problem.constraints && (
              <>
                <h3 className="text-xl font-bold mb-4">Constraints:</h3>
                <div className="bg-base-200 p-6 rounded-xl mb-6">
                  <span className="bg-black/90 px-4 py-1 rounded-lg font-semibold text-white text-lg">
                    {problem.constraints}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      case "submissions":
        return (
          <div>
            <SubmissionsList
              submissions={submissions}
              isLoading={isSubmissionsLoading}
            />
            {!isSubmissionsLoading && (!submissions || submissions.length === 0) && (
              <div className="text-center p-8 text-base-content/70">
                <p className="text-lg mb-2">No submissions found</p>
                <p className="text-sm">Submit your solution to see your submissions here</p>
              </div>
            )}
          </div>
        );
      case "discussion":
        return (
          <div className="p-4 text-center text-base-content/70">
            No discussions yet (next feature , under construction hai )
          </div>
        );
      case "hints":
        return (
          <div className="p-4">
            {problem?.hints ? (
              <div className="bg-base-200 p-6 rounded-xl">
                <span className="bg-black/90 px-4 py-1 rounded-lg font-semibold text-white text-lg">
                  {problem.hints}
                </span>
              </div>
            ) : (
              <div className="text-center text-base-content/70">
                No hints available( ...soon)
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 to-base-200 max-w-7xl w-full">
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1 gap-2 ">
          <Link to={"/"} className="flex items-center gap-2 text-primary">
            <Home className="w-6 h-6" />
            <ChevronRight className="w-4 h-4" />
          </Link>
          <div className="mt-2">
            <h1 className="text-xl font-bold">{problem.title}</h1>
            <div className="flex items-center gap-2 text-sm text-base-content/70 mt-5">
              <Clock className="w-4 h-4" />
              <span>
                Updated{" "}
                {new Date(problem.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-base-content/30">•</span>
              <Users className="w-4 h-4" />
              <span>{submissionCount} Submissions</span>
              <span className="text-base-content/30">•</span>
              <ThumbsUp className="w-4 h-4" />
              <span>95% Success Rate</span>
            </div>
          </div>
        </div>
        <div className="flex-none gap-4">
          <button
            className={`btn btn-ghost btn-circle ${
              isBookmarked ? "text-primary" : ""
            }`}
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-circle">
            <Share2 className="w-5 h-5" />
          </button>
          <select
            className="select select-bordered select-primary w-40"
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            {getAllLanguages().map((lang) => (
              <option key={lang.key} value={lang.key}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="tabs tabs-bordered">
                <button
                  className={`tab gap-2 ${
                    activeTab === "description" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("description")}
                >
                  <FileText className="w-4 h-4" />
                  Description
                </button>
                <button
                  className={`tab gap-2 ${
                    activeTab === "submissions" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("submissions")}
                >
                  <Code2 className="w-4 h-4" />
                  Submissions
                </button>
                <button
                  className={`tab gap-2 ${
                    activeTab === "discussion" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("discussion")}
                >
                  <MessageSquare className="w-4 h-4" />
                  Discussion
                </button>
                <button
                  className={`tab gap-2 ${
                    activeTab === "hints" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("hints")}
                >
                  <Lightbulb className="w-4 h-4" />
                  Hints
                </button>
              </div>

              <div className="p-6">{renderTabContent()}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="tabs tabs-bordered">
                <button className="tab tab-active gap-2">
                  <Terminal className="w-4 h-4" />
                  Code Editor
                </button>
              </div>

              <div className="h-[600px] w-full">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(selectedLanguage)}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => {
                    if (value !== undefined) {
                      setCode(value);
                    }
                  }}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 20,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              <div className="p-4 border-t border-base-300 bg-base-200">
                <div className="flex justify-between items-center">
                  <button
                    className={`btn btn-primary gap-2 ${
                      isExecuting ? "loading" : ""
                    }`}
                    onClick={handleRunCode}
                    disabled={isExecuting}
                  >
                    {!isExecuting && <Play className="w-4 h-4" />}
                    Run Code(DRY run)
                  </button>
                  <button 
                    className={`btn btn-success gap-2 ${
                      isExecuting ? "loading" : ""
                    }`}
                    onClick={handleSubmit}
                    disabled={isExecuting}
                  >
                    Submit Solution
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body">
            {submission ? (
              <div className="space-y-6">
                <Submission submission={submission} />
                
                {/* Enhanced Test Cases Display */}
                <div className="divider"></div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Test Cases
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testcases.map((testCase, index) => (
                    <div key={index} className="card bg-base-200 shadow-md">
                      <div className="card-body p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="badge badge-primary badge-sm">Test Case {index + 1}</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-base-content/70 mb-1 block">
                              Input:
                            </label>
                            <div className="bg-base-300 p-3 rounded-lg font-mono text-sm break-all">
                              {testCase.input || "N/A"}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-base-content/70 mb-1 block">
                              Expected Output:
                            </label>
                            <div className="bg-base-300 p-3 rounded-lg font-mono text-sm break-all">
                              {testCase.output || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Test Cases
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testcases.map((testCase, index) => (
                    <div key={index} className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
                      <div className="card-body p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="badge badge-primary badge-sm">Test Case {index + 1}</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-base-content/70 mb-1 block">
                              Input:
                            </label>
                            <div className="bg-base-300 p-3 rounded-lg font-mono text-sm break-all border border-base-content/10">
                              {testCase.input || "N/A"}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-base-content/70 mb-1 block">
                              Expected Output:
                            </label>
                            <div className="bg-base-300 p-3 rounded-lg font-mono text-sm break-all border border-base-content/10">
                              {testCase.output || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
