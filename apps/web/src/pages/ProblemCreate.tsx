import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, Loader2, Save } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, type Difficulty } from '../components/ProblemBadges'

interface Example {
  input: string
  output: string
  explanation?: string
}

interface Testcase {
  input: string
  output: string
}

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']

const LANGUAGES = [
  { key: 'JAVASCRIPT', label: 'JavaScript' },
  { key: 'PYTHON', label: 'Python' },
  { key: 'CPP', label: 'C++' },
  { key: 'JAVA', label: 'Java' },
]

export default function ProblemCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [constraints, setConstraints] = useState('')
  const [hints, setHints] = useState('')
  const [editorial, setEditorial] = useState('')

  const [examples, setExamples] = useState<Example[]>([{ input: '', output: '', explanation: '' }])
  const [testcases, setTestcases] = useState<Testcase[]>([{ input: '', output: '' }])

  const [codeSnippets, setCodeSnippets] = useState<Record<string, string>>({
    JAVASCRIPT: '',
    PYTHON: '',
    CPP: '',
    JAVA: '',
  })

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const addExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }])
  }

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index))
  }

  const updateExample = (index: number, field: keyof Example, value: string) => {
    const updated = [...examples]
    updated[index][field] = value
    setExamples(updated)
  }

  const addTestcase = () => {
    setTestcases([...testcases, { input: '', output: '' }])
  }

  const removeTestcase = (index: number) => {
    setTestcases(testcases.filter((_, i) => i !== index))
  }

  const updateTestcase = (index: number, field: keyof Testcase, value: string) => {
    const updated = [...testcases]
    updated[index][field] = value
    setTestcases(updated)
  }

  const updateCodeSnippet = (language: string, value: string) => {
    setCodeSnippets({ ...codeSnippets, [language]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required')
      }

      if (testcases.length === 0 || testcases.every((tc) => !tc.input.trim() || !tc.output.trim())) {
        throw new Error('At least one test case with input and output is required')
      }

      // Build examples object
      const examplesObj: Record<string, Example> = {}
      examples.forEach((ex, idx) => {
        if (ex.input.trim() || ex.output.trim()) {
          examplesObj[`example${idx + 1}`] = {
            input: ex.input,
            output: ex.output,
            explanation: ex.explanation,
          }
        }
      })

      // Filter empty testcases
      const validTestcases = testcases.filter((tc) => tc.input.trim() && tc.output.trim())

      const problemData = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        tags,
        examples: examplesObj,
        constraints: constraints.trim(),
        hints: hints.trim(),
        editorial: editorial.trim(),
        testcases: validTestcases,
        codeSnippets: Object.fromEntries(
          Object.entries(codeSnippets).filter(([_, code]) => code.trim())
        ),
      }

      await api('/algorank/problems', {
        method: 'POST',
        body: problemData,
      })

      navigate('/algorank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create problem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/algorank" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to AlgoRank
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Problem</h1>
        <p className="text-gray-600 mt-1">Create a new coding problem for the AlgoRank platform</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Two Sum"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the problem in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Examples</h2>
            <button
              type="button"
              onClick={addExample}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Example
            </button>
          </div>

          {examples.map((example, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Example {idx + 1}</span>
                {examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExample(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Input</label>
                <textarea
                  value={example.input}
                  onChange={(e) => updateExample(idx, 'input', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Example input..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Output</label>
                <textarea
                  value={example.output}
                  onChange={(e) => updateExample(idx, 'output', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Example output..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Explanation (optional)</label>
                <textarea
                  value={example.explanation}
                  onChange={(e) => updateExample(idx, 'explanation', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Explain this example..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Test Cases */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Test Cases *</h2>
            <button
              type="button"
              onClick={addTestcase}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Test Case
            </button>
          </div>

          {testcases.map((testcase, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Test Case {idx + 1}</span>
                {testcases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestcase(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Input *</label>
                <textarea
                  value={testcase.input}
                  onChange={(e) => updateTestcase(idx, 'input', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Test case input..."
                  required={idx === 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Expected Output *</label>
                <textarea
                  value={testcase.output}
                  onChange={(e) => updateTestcase(idx, 'output', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Expected output..."
                  required={idx === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1 <= nums.length <= 10^4..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hints</label>
            <textarea
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide hints to help users solve the problem..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Editorial</label>
            <textarea
              value={editorial}
              onChange={(e) => setEditorial(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide a detailed explanation of the solution approach..."
            />
          </div>
        </div>

        {/* Code Snippets */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Code Snippets (Optional)</h2>

          {LANGUAGES.map((lang) => (
            <div key={lang.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{lang.label}</label>
              <textarea
                value={codeSnippets[lang.key]}
                onChange={(e) => updateCodeSnippet(lang.key, e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`Provide a starter code template for ${lang.label}...`}
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            to="/algorank"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Creating...' : 'Create Problem'}
          </button>
        </div>
      </form>
    </div>
  )
}
