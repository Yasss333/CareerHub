import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, CheckCircle2, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, type Difficulty } from '../components/ProblemBadges'

interface ProblemRow {
  id: string
  title: string
  difficulty: Difficulty
  tags: string[]
  solved: boolean
  _count: { likes: number; comments: number; submissions: number }
}

interface ListResponse {
  problems: ProblemRow[]
  pagination: {
    currentPage: number
    totalPages: number
    totalProblems: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function AlgoRank() {
  const [problems, setProblems] = useState<ProblemRow[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [difficulty, setDifficulty] = useState('')
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [totalProblems, setTotalProblems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ tags: string[] }>('/algorank/problems/tags')
      .then((data) => setTags(data.tags))
      .catch(() => setTags([]))
  }, [])

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (difficulty) params.append('difficulty', difficulty)
      if (tag) params.append('tag', tag)
      if (search) params.append('search', search)

      const data = await api<ListResponse>(`/algorank/problems?${params}`)
      setProblems(data.problems)
      setTotalPages(data.pagination.totalPages)
      setTotalProblems(data.pagination.totalProblems)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [page, difficulty, tag, search])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AlgoRank</h1>
          <p className="text-gray-600 mt-2">Practice DSA problems and climb the leaderboard</p>
        </div>
        <Link
          to="/algorank/submissions"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          My Submissions
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search problems..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select
          value={tag}
          onChange={(e) => { setTag(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        >
          <option value="">All Tags</option>
          {tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Problem list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading problems...</div>
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          No problems found{search || difficulty || tag ? ' for the current filters' : ' yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/algorank/problems/${problem.id}`}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{problem.title}</span>
                  {problem.solved && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {problem.tags.slice(0, 5).map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {problem.solved ? 'Solved' : 'Unsolved'}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {problem._count?.likes ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {problem._count?.comments ?? 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalProblems > 0 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {Math.max(totalPages, 1)} · {totalProblems} problems
          </span>
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