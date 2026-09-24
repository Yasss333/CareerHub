import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ThumbsUp, MessageSquare, Code2, FolderPlus, ChevronLeft, Send } from 'lucide-react'
import { api } from '../lib/api'
import { DifficultyBadge, type Difficulty } from '../components/ProblemBadges'

interface Example {
  input?: string
  output?: string
  explanation?: string
}

interface ProblemDetail {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags: string[]
  examples: Record<string, Example>
  constraints: string
  hints?: string
  editorial?: string
  solved: boolean
  liked: boolean
  _count?: { likes: number; comments: number; submissions: number }
}

interface NestedComment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name?: string; image?: string; avatar?: string }
}

interface CommentType extends NestedComment {
  nestedComment: NestedComment[]
}

interface Playlist {
  id: string
  title: string
  description?: string
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [comments, setComments] = useState<CommentType[]>([])
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [showEditorial, setShowEditorial] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})

  const [showPlaylists, setShowPlaylists] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [playlistMsg, setPlaylistMsg] = useState('')

  const loadProblem = useCallback(async () => {
    try {
      const data = await api<{ problem: ProblemDetail }>(`/algorank/problems/${id}`)
      setProblem(data.problem)
      setLiked(data.problem.liked)
      setLikesCount(data.problem._count?.likes ?? 0)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadComments = useCallback(async () => {
    try {
      const data = await api<{ comments: CommentType[] }>(`/algorank/comments/${id}`)
      setComments(data.comments)
    } catch {
      // comments are non-critical
    }
  }, [id])

  useEffect(() => {
    loadProblem()
    loadComments()
  }, [loadProblem, loadComments])

  const toggleLike = async () => {
    try {
      const data = await api<{ liked: boolean; count: number }>('/algorank/likes', {
        method: 'POST',
        body: { problemId: id },
      })
      setLiked(data.liked)
      setLikesCount(data.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like')
    }
  }

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await api('/algorank/comments', { method: 'POST', body: { problemId: id, content: commentText } })
      setCommentText('')
      loadComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  const addReply = async (commentId: string) => {
    const content = replyTexts[commentId] || ''
    if (!content.trim()) return
    try {
      await api(`/algorank/comments/${commentId}/replies`, { method: 'POST', body: { content } })
      setReplyTexts((prev) => ({ ...prev, [commentId]: '' }))
      loadComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply')
    }
  }

  const loadPlaylists = async () => {
    try {
      const data = await api<{ playlists: Playlist[] }>('/algorank/playlists')
      setPlaylists(data.playlists)
    } catch {
      setPlaylists([])
    }
  }

  const openPlaylists = () => {
    setShowPlaylists(true)
    setPlaylistMsg('')
    loadPlaylists()
  }

  const createPlaylist = async () => {
    if (!newPlaylistTitle.trim()) return
    try {
      const data = await api<{ playlist: Playlist }>('/algorank/playlists', {
        method: 'POST',
        body: { title: newPlaylistTitle.trim() },
      })
      setNewPlaylistTitle('')
      setPlaylists((prev) => [data.playlist, ...prev])
      setPlaylistMsg(`Playlist "${data.playlist.title}" created`)
    } catch (err) {
      setPlaylistMsg(err instanceof Error ? err.message : 'Failed to create playlist')
    }
  }

  const addToPlaylist = async (playlistId: string) => {
    try {
      await api(`/algorank/playlists/${playlistId}/problems`, {
        method: 'POST',
        body: { problemIds: [id] },
      })
      setPlaylistMsg('Problem added to playlist')
    } catch (err) {
      setPlaylistMsg(err instanceof Error ? err.message : 'Failed to add problem')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading problem...</div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error || 'Problem not found'}
      </div>
    )
  }

  return (
    <div>
      <Link to="/algorank" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to problems
      </Link>

      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.solved && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate(`/algorank/problems/${id}/solve`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Code2 className="w-4 h-4" />
            Solve
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-4 mb-6 text-sm">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              liked ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-blue-600' : ''}`} />
            {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
          </button>
          <button
            onClick={openPlaylists}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Save to Playlist
          </button>
          <span className="flex items-center gap-1.5 text-gray-500">
            <MessageSquare className="w-4 h-4" />
            {comments.length} comments
          </span>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Problem Statement</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
        </div>

        {/* Examples */}
        {Object.entries(problem.examples || {}).map(([key, example]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 capitalize">{key.replace('example', 'Example ')}</h3>
            {example.input !== undefined && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-600">Input: </span>
                <code className="text-sm bg-gray-50 px-2 py-1 rounded">{example.input}</code>
              </div>
            )}
            {example.output !== undefined && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-600">Output: </span>
                <code className="text-sm bg-gray-50 px-2 py-1 rounded">{example.output}</code>
              </div>
            )}
            {example.explanation && (
              <p className="text-sm text-gray-600">{example.explanation}</p>
            )}
          </div>
        ))}

        {/* Constraints */}
        {problem.constraints && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Constraints</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{problem.constraints}</p>
          </div>
        )}

        {/* Hints */}
        {problem.hints && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <button
              onClick={() => setShowHints((v) => !v)}
              className="font-semibold text-gray-900"
            >
              {showHints ? 'Hide' : 'Show'} Hints
            </button>
            {showHints && <p className="text-gray-700 mt-3 whitespace-pre-wrap">{problem.hints}</p>}
          </div>
        )}

        {/* Editorial */}
        {problem.editorial && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <button
              onClick={() => setShowEditorial((v) => !v)}
              className="font-semibold text-gray-900"
            >
              {showEditorial ? 'Hide' : 'View'} Solution / Editorial
            </button>
            {showEditorial && <p className="text-gray-700 mt-3 whitespace-pre-wrap">{problem.editorial}</p>}
          </div>
        )}

        {/* Comments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Discussion ({comments.length})</h2>

          <form onSubmit={addComment} className="flex gap-2 mb-6">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your approach..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Post
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">No comments yet. Be the first to discuss!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                      {(comment.user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{comment.user.name || 'User'}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">{comment.content}</p>

                  {comment.nestedComment.length > 0 && (
                    <div className="space-y-2 ml-9 mb-2">
                      {comment.nestedComment.map((sub) => (
                        <div key={sub.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800">{sub.user.name || 'User'}</span>
                            <span className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{sub.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyTexts[comment.id] || ''}
                      onChange={(e) => setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                      placeholder="Reply..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => addReply(comment.id)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playlists modal */}
      {showPlaylists && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowPlaylists(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save to Playlist</h3>
              <button onClick={() => setShowPlaylists(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {playlistMsg && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-3">
                {playlistMsg}
              </div>
            )}

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {playlists.length === 0 && <p className="text-sm text-gray-500">No playlists yet.</p>}
              {playlists.map((playlist) => (
                <div key={playlist.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{playlist.title}</span>
                  <button
                    onClick={() => addToPlaylist(playlist.id)}
                    className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="New playlist name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createPlaylist}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}