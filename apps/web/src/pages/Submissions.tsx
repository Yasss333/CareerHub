import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, SubmissionStatusBadge, languageLabel, type Difficulty } from '../components/ProblemBadges'

interface SubmissionRow {
  id: string
  status: string
  language: string
  createdAt: string
  problem: { id: string; title: string; difficulty: Difficulty; tags: string[] }
  _count?: { testcases: number }
}

interface ListResponse {
  submissions: SubmissionRow[]
  pagination: {
    currentPage: number
    totalPages: number
    totalSubmissions: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function Submissions() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<ListResponse>(`/algorank/submissions?page=${page}&limit=15`)
      setSubmissions(data.submissions)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.totalSubmissions)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-2">Your coding activity across all problems</p>
        </div>
        <Link to="/algorank" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
          Back to Problems
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading submissions...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          No submissions yet.{' '}
          <Link to="/algorank" className="text-blue-600 hover:underline">Start solving problems.</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                to={`/algorank/problems/${sub.problem.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <SubmissionStatusBadge status={sub.status} />
                  <div>
                    <div className="font-medium text-gray-900">{sub.problem.title}</div>
                    <div className="text-xs text-gray-500">
                      {languageLabel(sub.language)}
                      {sub._count?.testcases !== undefined && ` · ${sub._count.testcases} test cases`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={sub.problem.difficulty} />
                  <span className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {Math.max(totalPages, 1)} · {total} submissions</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}