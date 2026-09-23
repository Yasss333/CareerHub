import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Video, Star, MessageSquare, CheckCircle, XCircle, X, Trash2 } from 'lucide-react'

interface Session {
  id: string
  scheduledTime: string
  duration: number
  topic: string
  notes: string
  status: string
  jitsiRoomUrl: string
  feedback: { rating: number } | null
  junior: {
    id: string
    name: string
    avatar: string
    university: string
  }
  senior: {
    id: string
    name: string
    avatar: string
    title: string
    company: string
  }
}

interface FeedbackModalProps {
  session: Session
  onClose: () => void
  onSubmitted: () => void
}

function FeedbackModal({ session, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please select a rating')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${session.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit feedback')
      }
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Leave Feedback</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          How was your session with {session.senior.name}?
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  title={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 ${n <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What did you like? What could be improved?"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated, optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., Helpful, Clear explanations"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SeniorConnectSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null)
  const [acting, setActing] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const response = await fetch(`/api/connect/sessions${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setError('Failed to load sessions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [statusFilter])

  const apiCall = async (method: string, url: string, body?: object) => {
    const token = localStorage.getItem('token')
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Request failed')
    }
    return response.json()
  }

  const handleStatus = async (sessionId: string, status: string) => {
    setActing(`${sessionId}:${status}`)
    setActionError('')
    try {
      await apiCall('PUT', `/api/connect/sessions/${sessionId}/status`, { status })
      await fetchSessions()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update session')
    } finally {
      setActing('')
    }
  }

  const handleCancel = async (sessionId: string) => {
    setActing(`${sessionId}:cancel`)
    setActionError('')
    try {
      await apiCall('DELETE', `/api/connect/sessions/${sessionId}`)
      await fetchSessions()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel session')
    } finally {
      setActing('')
    }
  }

  const handleStartSession = async (sessionId: string) => {
    setActing(`${sessionId}:start`)
    setActionError('')
    try {
      const data = await apiCall('POST', `/api/connect/sessions/${sessionId}/start`)
      window.open(data.jitsiRoomUrl, '_blank')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start session')
    } finally {
      setActing('')
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    setActing(`${sessionId}:complete`)
    setActionError('')
    try {
      await apiCall('POST', `/api/connect/sessions/${sessionId}/complete`)
      await fetchSessions()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete session')
    } finally {
      setActing('')
    }
  }

  const isBusy = (sessionId: string, action = '') => acting === `${sessionId}:${action}` || acting === sessionId

  const getRoleLabel = (session: Session): 'Junior' | 'Senior' => {
    return session.junior?.id === currentUser.id ? 'Junior' : 'Senior'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
      pending: { color: 'bg-yellow-50 text-yellow-700', icon: Clock },
      accepted: { color: 'bg-blue-50 text-blue-700', icon: CheckCircle },
      rejected: { color: 'bg-red-50 text-red-700', icon: XCircle },
      started: { color: 'bg-purple-50 text-purple-700', icon: Video },
      completed: { color: 'bg-gray-50 text-gray-700', icon: CheckCircle },
      cancelled: { color: 'bg-red-50 text-red-700', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const otherPerson = (session: Session) => {
    return getRoleLabel(session) === 'Junior' ? session.senior : session.junior
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading sessions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">Manage your mentorship sessions</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {actionError}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Book your first session with a senior mentor</p>
          <Link
            to="/connect"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Find Mentors
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const role = getRoleLabel(session)
            const peer = otherPerson(session)
            const canCancel = role === 'Junior' && ['pending', 'accepted', 'started'].includes(session.status)

            return (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={peer?.avatar || '/default-avatar.png'}
                      alt={peer?.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                      <p className="text-sm text-gray-600">
                        {role === 'Junior' ? 'with' : 'mentoring'} {peer?.name}
                        {session.senior?.title && role === 'Junior' ? ` (${session.senior.title} at ${session.senior.company})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {role}
                    </span>
                    {getStatusBadge(session.status)}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(session.scheduledTime).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(session.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {session.duration} minutes
                  </span>
                </div>

                {session.notes && (
                  <p className="text-sm text-gray-600 mb-4 italic">"{session.notes}"</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {role === 'Senior' && session.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatus(session.id, 'accepted')}
                        disabled={isBusy(session.id, 'accepted')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatus(session.id, 'rejected')}
                        disabled={isBusy(session.id, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {session.status === 'accepted' && (
                    <button
                      onClick={() => handleStartSession(session.id)}
                      disabled={isBusy(session.id, 'start')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Video className="w-4 h-4" />
                      Start Meeting
                    </button>
                  )}

                  {session.status === 'started' && (
                    <button
                      onClick={() => handleCompleteSession(session.id)}
                      disabled={isBusy(session.id, 'complete')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Session
                    </button>
                  )}

                  {role === 'Junior' && session.status === 'completed' && !session.feedback && (
                    <button
                      onClick={() => setFeedbackSession(session)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Leave Feedback
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(session.id)}
                      disabled={isBusy(session.id, 'cancel')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {feedbackSession && (
        <FeedbackModal
          session={feedbackSession}
          onClose={() => setFeedbackSession(null)}
          onSubmitted={() => {
            setFeedbackSession(null)
            fetchSessions()
          }}
        />
      )}
    </div>
  )
}