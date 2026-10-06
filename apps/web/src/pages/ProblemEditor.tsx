import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Send, ChevronLeft, Loader2, CheckCircle2, XCircle, Settings } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, SubmissionStatusBadge, languageLabel, type Difficulty } from '../components/ProblemBadges'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface Example {
  input?: string
  output?: string
  explanation?: string
}

interface Testcase {
  input: string
  output: string
}

interface Problem {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags: string[]
  examples: Record<string, Example>
  constraints: string
  hints?: string
  codeSnippets?: Record<string, string>
  testcases: Testcase[]
}

interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
  status: { id: number; description: string }
  memory: string | null
  time: string | null
}

interface TestCaseResult {
  testCase: number
  passed: boolean
  stdout: string
  expected: string
  stderr: string
  status: string
  memory: string
  time: string
}

interface SubmissionRow {
  id: string
  status: string
  language: string
  createdAt: string
}

const LANGUAGES = [
  { key: 'JAVASCRIPT', label: 'JavaScript' },
  { key: 'PYTHON', label: 'Python' },
  { key: 'CPP', label: 'C++' },
  { key: 'JAVA', label: 'Java' },
]

const CODE_TEMPLATES: Record<string, string> = {
  JAVASCRIPT: `// Write your solution here
function solve(input) {
  // Parse input if needed
  // Your code here
  return result
}

// Read from stdin (if needed)
// process.stdin.on('data', data => {
//   const input = data.toString().trim()
//   console.log(solve(input))
// })`,
  PYTHON: `# Write your solution here
def solve():
    # Read input if needed
    # Your code here
    pass

if __name__ == "__main__":
    solve()`,
  CPP: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  JAVA: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
}

export default function ProblemEditor() {
  const { id } = useParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState('JAVASCRIPT')
  const [code, setCode] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('')
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionRow[]>([])

  const [showSettings, setShowSettings] = useState(false)
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'off' as 'off' | 'on',
    minimap: false,
    lineNumbers: 'on' as 'on' | 'off',
  })

  const loadProblem = useCallback(async () => {
    try {
      const data = await api<{ problem: Problem }>(`/algorank/problems/${id}`)
      const problem = data.problem
      setProblem(problem)
      const snippets = problem.codeSnippets || {}
      setCode(snippets['JAVASCRIPT'] || snippets[Object.keys(snippets)[0]] || '// Write your solution here')
      if (Array.isArray(problem.testcases) && problem.testcases.length > 0) {
        setCustomInput(problem.testcases[0].input)
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadRecentSubmissions = useCallback(async () => {
    try {
      const data = await api<{ submissions: SubmissionRow[] }>(`/algorank/problems/${id}/submissions`)
      setRecentSubmissions(data.submissions.slice(0, 10))
    } catch {
      // non-critical
    }
  }, [id])

  useEffect(() => {
    loadProblem()
    loadRecentSubmissions()
  }, [loadProblem, loadRecentSubmissions])

  const switchLanguage = (key: string) => {
    setLanguage(key)
    const snippets = problem?.codeSnippets || {}
    setCode(snippets[key] || CODE_TEMPLATES[key] || CODE_TEMPLATES['JAVASCRIPT'])
  }

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyS, () => {
      // Auto-save logic could be added here
      console.log('Code saved to local state')
    })

    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run()
    })
  }

  const runCode = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const data = await api<{ result: RunResult }>('/algorank/execute', {
        method: 'POST',
        body: { sourceCode: code, languageKey: language, stdin: customInput },
      })
      setRunResult(data.result)
      setError('')
    } catch (err) {
      setRunResult(null)
      setError(err instanceof Error ? err.message : 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  const submitCode = async () => {
    setSubmitting(true)
    setSubmissionStatus('')
    setTestCaseResults([])
    try {
      const data = await api<{ submission: { status: string }; testCaseResults: TestCaseResult[] }>('/algorank/submissions', {
        method: 'POST',
        body: { problemId: id, sourceCode: code, languageKey: language },
      })
      setSubmissionStatus(data.submission.status)
      setTestCaseResults(data.testCaseResults)
      setError('')
      loadRecentSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading problem...</div>
      </div>
    )
  }

  if (error && !problem) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div>
      <Link to={`/algorank/problems/${id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to problem
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem statement */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{problem?.title}</h1>
              {problem && <DifficultyBadge difficulty={problem.difficulty} />}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {problem?.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Statement</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{problem?.description}</p>
          </div>

          {Object.entries(problem?.examples || {}).map(([key, example]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-2 capitalize">{key.replace('example', 'Example ')}</h3>
              {example.input !== undefined && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Input: </span>
                  <code className="text-sm bg-gray-50 px-2 py-1 rounded">{example.input}</code>
                </div>
              )}
              {example.output !== undefined && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Output: </span>
                  <code className="text-sm bg-gray-50 px-2 py-1 rounded">{example.output}</code>
                </div>
              )}
              {example.explanation && <p className="text-sm text-gray-600">{example.explanation}</p>}
            </div>
          ))}

          {problem?.constraints && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Constraints</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{problem.constraints}</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.key}
                    onClick={() => switchLanguage(lang.key)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      language === lang.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editor Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={runCode}
                  disabled={running}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run
                </button>
              </div>
            </div>

            {/* Editor Settings Panel */}
            {showSettings && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={editorSettings.fontSize}
                      onChange={(e) => setEditorSettings({ ...editorSettings, fontSize: Number(e.target.value) })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={12}>12px</option>
                      <option value={14}>14px</option>
                      <option value={16}>16px</option>
                      <option value={18}>18px</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tab Size</label>
                    <select
                      value={editorSettings.tabSize}
                      onChange={(e) => setEditorSettings({ ...editorSettings, tabSize: Number(e.target.value) })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Word Wrap</label>
                    <select
                      value={editorSettings.wordWrap}
                      onChange={(e) => setEditorSettings({ ...editorSettings, wordWrap: e.target.value as 'off' | 'on' })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="off">Off</option>
                      <option value="on">On</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Minimap</label>
                    <select
                      value={editorSettings.minimap ? 'on' : 'off'}
                      onChange={(e) => setEditorSettings({ ...editorSettings, minimap: e.target.value === 'on' })}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="off">Off</option>
                      <option value="on">On</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            <Editor
              height="384px"
              language={language.toLowerCase()}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-light"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: editorSettings.minimap },
                fontSize: editorSettings.fontSize,
                lineNumbers: editorSettings.lineNumbers,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: editorSettings.tabSize,
                insertSpaces: true,
                wordWrap: editorSettings.wordWrap,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                folding: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
              Custom Input (one line per argument)
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              spellCheck={false}
              className="w-full h-24 p-3 font-mono text-sm bg-gray-50 focus:outline-none resize-none"
            />
          </div>

          {/* Run result */}
          {runResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full border ${
                    runResult.exitCode === 0
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {runResult.exitCode === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {runResult.status.description}
                  </span>
                  {runResult.time !== null && <span className="text-xs text-gray-500">Time: {runResult.time}s</span>}
                  {runResult.memory !== null && <span className="text-xs text-gray-500">Memory: {runResult.memory} KB</span>}
                </div>
                <span className="text-xs text-gray-400">Exit code: {runResult.exitCode}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Standard Output</div>
                <pre className="bg-gray-50 rounded p-3 font-mono text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{runResult.stdout || '(no output)'}</pre>
              </div>
              {runResult.stderr && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-red-600 mb-1">Standard Error</div>
                  <pre className="bg-red-50 rounded p-3 font-mono text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{runResult.stderr}</pre>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submitCode}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Submitting...' : 'Submit Solution'}
          </button>

          {/* Submission result */}
          {submissionStatus && (
            <div className={`bg-white border rounded-lg p-4 ${
              submissionStatus === 'Accepted' ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <SubmissionStatusBadge status={submissionStatus} />
                <span className="text-sm text-gray-600">
                  {submissionStatus === 'Accepted' ? 'All test cases passed!' : 'Some test cases failed.'}
                </span>
              </div>
              {testCaseResults.length > 0 && (
                <div className="space-y-2">
                  {testCaseResults.map((tc) => (
                    <div key={tc.testCase} className={`border rounded-lg p-3 ${tc.passed ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Test case {tc.testCase}</span>
                        <SubmissionStatusBadge status={tc.status} />
                      </div>
                      <div className="text-xs space-y-1 font-mono">
                        <div className="text-gray-600">
                          <span className="text-gray-400">Expected: </span>{tc.expected || '(empty)'}
                        </div>
                        <div className="text-gray-600">
                          <span className="text-gray-400">Received: </span>{tc.stdout?.trim() || '(empty)'}
                        </div>
                        {tc.time && <div className="text-gray-400">Time: {tc.time}s · Memory: {tc.memory} KB</div>}
                        {tc.stderr && <div className="text-red-500">{tc.stderr}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent submissions */}
          {recentSubmissions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
                Recent Submissions
              </div>
              <div className="divide-y divide-gray-100">
                {recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-2.5">
                    <SubmissionStatusBadge status={sub.status} />
                    <span className="text-xs text-gray-500">{languageLabel(sub.language)}</span>
                    <span className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}