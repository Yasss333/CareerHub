import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Trash2, X, ChevronRight, Loader2 } from 'lucide-react'
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

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchPlaylists = async () => {
    try {
      const data = await api<{ playlists: Playlist[] }>('/algorank/playlists')
      setPlaylists(data.playlists)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      if (!newPlaylistTitle.trim()) {
        throw new Error('Playlist title is required')
      }

      await api('/algorank/playlists', {
        method: 'POST',
        body: {
          title: newPlaylistTitle.trim(),
          description: newPlaylistDescription.trim() || null,
        },
      })

      setNewPlaylistTitle('')
      setNewPlaylistDescription('')
      setShowCreateModal(false)
      fetchPlaylists()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return

    try {
      await api(`/algorank/playlists/${playlistId}`, {
        method: 'DELETE',
      })
      fetchPlaylists()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete playlist')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading playlists...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Playlists</h1>
          <p className="text-gray-600 mt-2">Organize and save your favorite problems</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Playlist
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No playlists yet</h3>
          <p className="text-gray-600 mb-4">Create your first playlist to save problems</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{playlist.title}</h3>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {playlist.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{playlist.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <FolderOpen className="w-4 h-4" />
                  <span>{playlist.problems.length} problems</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {playlist.problems.slice(0, 3).map((item) => (
                    <span
                      key={item.problem.id}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {item.problem.difficulty}
                    </span>
                  ))}
                  {playlist.problems.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      +{playlist.problems.length - 3} more
                    </span>
                  )}
                </div>

                <Link
                  to={`/algorank/playlists/${playlist.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Playlist
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Create New Playlist</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dynamic Programming Practice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this playlist..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
