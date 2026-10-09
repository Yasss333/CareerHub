import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import Editor from '@monaco-editor/react';

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface Problem {
  id?: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  examples: Example[];
  constraints: string;
  hints?: string;
  editorial?: string;
  testcases: Array<{ input: string; output: string }>;
  codeSnippets?: Record<string, string>;
}

export default function AdminProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<Problem>({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    tags: [],
    examples: [{ input: '', output: '', explanation: '' }],
    constraints: '',
    hints: '',
    editorial: '',
    testcases: [{ input: '', output: '' }],
    codeSnippets: {
      JAVASCRIPT: '// JavaScript solution',
      PYTHON: '# Python solution',
      CPP: '// C++ solution',
      JAVA: '// Java solution',
    },
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    examples: true,
    testcases: true,
    codeSnippets: true,
  });

  const fetchProblems = async () => {
    try {
      const data = await api<{ problems: Problem[] }>('/algorank/problems');
      setProblems(data.problems);
    } catch (err) {
      setError('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const method = editingProblem ? 'PUT' : 'POST';
      const url = editingProblem ? `/algorank/problems/${editingProblem.id}` : '/algorank/problems';

      await api(url, {
        method,
        body: form,
      });

      setSuccess(editingProblem ? 'Problem updated successfully' : 'Problem created successfully');
      setShowForm(false);
      setEditingProblem(null);
      resetForm();
      fetchProblems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;

    try {
      await api(`/algorank/problems/${id}`, { method: 'DELETE' });
      setSuccess('Problem deleted successfully');
      fetchProblems();
    } catch (err) {
      setError('Failed to delete problem');
    }
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setForm(problem);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      difficulty: 'MEDIUM',
      tags: [],
      examples: [{ input: '', output: '', explanation: '' }],
      constraints: '',
      hints: '',
      editorial: '',
      testcases: [{ input: '', output: '' }],
      codeSnippets: {
        JAVASCRIPT: '// JavaScript solution',
        PYTHON: '# Python solution',
        CPP: '// C++ solution',
        JAVA: '// Java solution',
      },
    });
  };

  const addExample = () => {
    setForm({
      ...form,
      examples: [...form.examples, { input: '', output: '', explanation: '' }],
    });
  };

  const removeExample = (index: number) => {
    setForm({
      ...form,
      examples: form.examples.filter((_, i) => i !== index),
    });
  };

  const addTestcase = () => {
    setForm({
      ...form,
      testcases: [...form.testcases, { input: '', output: '' }],
    });
  };

  const removeTestcase = (index: number) => {
    setForm({
      ...form,
      testcases: form.testcases.filter((_, i) => i !== index),
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  if (loading) {
    return <div className="text-center py-8">Loading problems...</div>;
  }

  if (showForm) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProblem(null);
              resetForm();
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
            Back to Problems
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {editingProblem ? 'Edit Problem' : 'Create New Problem'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags.join(', ')}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Arrays, Dynamic Programming"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Constraints</label>
              <textarea
                value={form.constraints}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hints</label>
              <textarea
                value={form.hints || ''}
                onChange={(e) => setForm({ ...form, hints: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Examples */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              type="button"
              onClick={() => toggleSection('examples')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">Examples</h2>
              {expandedSections.examples ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.examples && (
              <div className="mt-4 space-y-4">
                {form.examples.map((example, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Example {index + 1}</span>
                      {form.examples.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExample(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                        <input
                          type="text"
                          value={example.input}
                          onChange={(e) => {
                            const newExamples = [...form.examples];
                            newExamples[index] = { ...example, input: e.target.value };
                            setForm({ ...form, examples: newExamples });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
                        <input
                          type="text"
                          value={example.output}
                          onChange={(e) => {
                            const newExamples = [...form.examples];
                            newExamples[index] = { ...example, output: e.target.value };
                            setForm({ ...form, examples: newExamples });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                        <textarea
                          value={example.explanation || ''}
                          onChange={(e) => {
                            const newExamples = [...form.examples];
                            newExamples[index] = { ...example, explanation: e.target.value };
                            setForm({ ...form, examples: newExamples });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExample}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Example
                </button>
              </div>
            )}
          </div>

          {/* Test Cases */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              type="button"
              onClick={() => toggleSection('testcases')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">Test Cases</h2>
              {expandedSections.testcases ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.testcases && (
              <div className="mt-4 space-y-4">
                {form.testcases.map((testcase, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Test Case {index + 1}</span>
                      {form.testcases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestcase(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                        <textarea
                          value={testcase.input}
                          onChange={(e) => {
                            const newTestcases = [...form.testcases];
                            newTestcases[index] = { ...testcase, input: e.target.value };
                            setForm({ ...form, testcases: newTestcases });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Output</label>
                        <textarea
                          value={testcase.output}
                          onChange={(e) => {
                            const newTestcases = [...form.testcases];
                            newTestcases[index] = { ...testcase, output: e.target.value };
                            setForm({ ...form, testcases: newTestcases });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTestcase}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Test Case
                </button>
              </div>
            )}
          </div>

          {/* Code Snippets */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              type="button"
              onClick={() => toggleSection('codeSnippets')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900">Code Snippets</h2>
              {expandedSections.codeSnippets ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.codeSnippets && (
              <div className="mt-4 space-y-4">
                {Object.entries(form.codeSnippets || {}).map(([lang, code]) => (
                  <div key={lang}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{lang}</label>
                    <Editor
                      height="200px"
                      language={lang.toLowerCase()}
                      value={code}
                      onChange={(value) => {
                        setForm({
                          ...form,
                          codeSnippets: { ...form.codeSnippets, [lang]: value || '' },
                        });
                      }}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingProblem(null);
                resetForm();
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Problem'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Problem Management</h1>
          <p className="text-gray-600 mt-2">Create and manage coding problems</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProblem(null);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Problem
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {problems.map((problem) => (
              <tr key={problem.id}>
                <td className="px-6 py-4 whitespace-nowrap">{problem.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    problem.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                    problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{problem.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(problem)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(problem.id!)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}