import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2, BookOpen, CheckCircle2, XCircle, FolderOpen, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, type Difficulty } from '../components/ProblemBadges'

interface ProblemInPlaylist {
  id: string
  title: string
  difficulty: Difficulty
  tags: string[]
  description: string
}

interface Playlist {
  id: string
  title: string
  description: string | null
  createdAt: string
  problems: Array<{ problem: ProblemInPlaylist }>
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchPlaylist = async () => {
    try {
      const data = await api<{ playlist: Playlist }>(`/algorank/playlists/${id}`)
      setPlaylist(data.playlist)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylist()
  }, [id])

  const handleRemoveProblem = async (problemId: string) => {
    if (!confirm('Are you sure you want to remove this problem from the playlist?')) return

    setRemoving(problemId)
    try {
      await api(`/algorank/playlists/${id}/problems/${problemId}`, {
        method: 'DELETE',
      })
      fetchPlaylist()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove problem')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading playlist...</div>
      </div>
    )
  }

  if (error && !playlist) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/algorank/playlists" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to Playlists
      </Link>

      {playlist && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-gray-600 mt-2">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <FolderOpen className="w-4 h-4" />
              <span>{playlist.problems.length} problems</span>
              <span>•</span>
              <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {playlist.problems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No problems in this playlist</h3>
              <p className="text-gray-600 mb-4">
                Add problems from the problem list to build your collection
              </p>
              <Link
                to="/algorank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Problems
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {playlist.problems.map((item) => (
                <div
                  key={item.problem.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          to={`/algorank/problems/${item.problem.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {item.problem.title}
                        </Link>
                        <DifficultyBadge difficulty={item.problem.difficulty} />
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.problem.description}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {item.problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.problem.tags.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              +{item.problem.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/algorank/problems/${item.problem.id}/solve`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Solve
                      </Link>
                      <button
                        onClick={() => handleRemoveProblem(item.problem.id)}
                        disabled={removing === item.problem.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Remove from playlist"
                      >
                        {removing === item.problem.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
