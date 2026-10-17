import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Video, Star, MessageSquare, CheckCircle, XCircle, X, Trash2, List, TrendingUp, Calendar as CalendarIcon, Edit3, Save, Sparkles, Award } from 'lucide-react'
import SessionCalendar from '../components/SessionCalendar'
import SessionAnalytics from '../components/SessionAnalytics'
import RescheduleModal from '../components/RescheduleModal'
import VideoMeetingModal from '../components/VideoMeetingModal'
import SessionChatModal from '../components/SessionChatModal'

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
    pri?: {
      score: number
      interviewAvg: number
      interviewCount: number
      problemsSolved: number
      dsaScore: number
      resumeScore: number
      readinessLevel: string
    }
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics'>('list')
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null)
  const [editingNotesSession, setEditingNotesSession] = useState<Session | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [activeMeetingSession, setActiveMeetingSession] = useState<Session | null>(null)
  const [activeChatSession, setActiveChatSession] = useState<Session | null>(null)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchSessions = async () => {
    setLoading(true)
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
      setError('')
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

  const handleJoinCall = async (session: Session) => {
    setActing(`${session.id}:start`)
    setActionError('')
    try {
      if (session.status === 'accepted') {
        await apiCall('POST', `/api/connect/sessions/${session.id}/start`)
        fetchSessions()
      }
      setActiveMeetingSession(session)
    } catch (err) {
      // If error occurs, still open meeting modal if we have room url
      setActiveMeetingSession(session)
    } finally {
      setActing('')
    }
  }

  const handleStartSession = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      await handleJoinCall(session)
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    setActing(`${sessionId}:complete`)
    setActionError('')
    try {
      await apiCall('POST', `/api/connect/sessions/${sessionId}/complete`)
      await fetchSessions()
      if (activeMeetingSession?.id === sessionId) {
        setActiveMeetingSession(null)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete session')
    } finally {
      setActing('')
    }
  }

  const handleEditNotes = (session: Session) => {
    setEditingNotesSession(session)
    setEditingNotes(session.notes || '')
  }

  const handleSaveNotes = async () => {
    if (!editingNotesSession) return

    setActing(`${editingNotesSession.id}:notes`)
    setActionError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${editingNotesSession.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: editingNotes })
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      setEditingNotesSession(null)
      setEditingNotes('')
      fetchSessions()
    } catch (err) {
      setActionError('Failed to save notes')
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
      accepted: { color: 'bg-primary/5 text-primary', icon: CheckCircle },
      rejected: { color: 'bg-red-50 text-red-700', icon: XCircle },
      started: { color: 'bg-primary/5 text-primary', icon: Video },
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

  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId)
    if (!session) return

    if (session.status === 'started' && session.jitsiRoomUrl) {
      window.open(session.jitsiRoomUrl, '_blank')
    }
  }

  const calendarSessions = sessions.map(session => ({
    id: session.id,
    seniorId: session.senior.id,
    seniorName: session.senior.name,
    seniorAvatar: session.senior.avatar,
    topic: session.topic,
    scheduledTime: session.scheduledTime,
    duration: session.duration,
    status: session.status,
    jitsiRoomUrl: session.jitsiRoomUrl
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">My Sessions</h1>
          <p className="mt-2 text-muted-foreground">Manage your mentorship sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${viewMode === 'analytics' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
          </div>
          <select
            aria-label="Filter sessions by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
      </div>

      {error && <div role="alert" aria-live="assertive" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><button type="button" onClick={fetchSessions} className="font-semibold underline underline-offset-2">Try again</button></div>}

      {loading && <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center text-muted-foreground">Loading sessions…</div>}

      {actionError && (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          {actionError}
        </div>
      )}

      {!loading && !error && viewMode === 'calendar' ? (
        <SessionCalendar
          sessions={calendarSessions}
          onSessionClick={handleSessionClick}
        />
      ) : !loading && !error && viewMode === 'analytics' ? (
        <SessionAnalytics />
      ) : !loading && !error && sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Book your first session with a senior mentor</p>
          <Link
            to="/connect"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Find Mentors
          </Link>
        </div>
      ) : !loading && !error ? (
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

                {editingNotesSession?.id === session.id ? (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add session notes or preparation materials..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isBusy(session.id, 'notes')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotesSession(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {session.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-gray-600 italic">"{session.notes}"</p>
                          <button
                            onClick={() => handleEditNotes(session)}
                            className="text-gray-400 hover:text-primary ml-2"
                            title="Edit notes"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {!session.notes && (
                      <button
                        onClick={() => handleEditNotes(session)}
                        className="mb-4 flex items-center gap-1 text-sm text-primary hover:text-primary"
                      >
                        <Edit3 className="w-4 h-4" />
                        Add notes
                      </button>
                    )}
                  </>
                )}

                {/* Candidate Placement Readiness Card (for Seniors reviewing bookings) */}
                {role === 'Senior' && session.junior?.pri && (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Candidate Readiness (PRI)
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            session.junior.pri.score >= 80
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : session.junior.pri.score >= 60
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {session.junior.pri.score}% PRI ({session.junior.pri.readinessLevel} Readiness)
                        </span>
                      </div>
                      {session.junior.university && (
                        <span className="text-xs text-muted-foreground">{session.junior.university}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <div className="text-muted-foreground">Mock Interview</div>
                        <div className="font-semibold text-foreground text-sm">{session.junior.pri.interviewAvg}%</div>
                        <div className="text-[10px] text-muted-foreground">{session.junior.pri.interviewCount} sessions</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <div className="text-muted-foreground">AlgoRank DSA</div>
                        <div className="font-semibold text-foreground text-sm">{session.junior.pri.dsaScore}%</div>
                        <div className="text-[10px] text-muted-foreground">{session.junior.pri.problemsSolved} solved</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <div className="text-muted-foreground">Resume Quality</div>
                        <div className="font-semibold text-foreground text-sm">{session.junior.pri.resumeScore}%</div>
                        <div className="text-[10px] text-muted-foreground">{session.junior.pri.resumesCount || 1} resumes</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                  {/* Topmate Direct Accept / Decline for Senior */}
                  {role === 'Senior' && session.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatus(session.id, 'accepted')}
                        disabled={isBusy(session.id, 'accepted')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept Session
                      </button>
                      <button
                        onClick={() => handleStatus(session.id, 'rejected')}
                        disabled={isBusy(session.id, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </>
                  )}

                  {/* Guaranteed Working Video Call Button (for both Mentor & Mentee) */}
                  {['accepted', 'started'].includes(session.status) && (
                    <button
                      onClick={() => handleJoinCall(session)}
                      disabled={isBusy(session.id, 'start')}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium shadow-xs"
                    >
                      <Video className="w-4 h-4" />
                      Join Video Call
                    </button>
                  )}

                  {/* Complete Session for Senior */}
                  {role === 'Senior' && session.status === 'started' && (
                    <button
                      onClick={() => handleCompleteSession(session.id)}
                      disabled={isBusy(session.id, 'complete')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Session
                    </button>
                  )}

                  {/* Guaranteed Working Chat Button (for both Mentor & Mentee) */}
                  <button
                    onClick={() => setActiveChatSession(session)}
                    className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Chat
                  </button>

                  {role === 'Junior' && session.status === 'completed' && !session.feedback && (
                    <button
                      onClick={() => setFeedbackSession(session)}
                      className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      Leave Feedback
                    </button>
                  )}

                  {['pending', 'accepted'].includes(session.status) && (
                    <button
                      onClick={() => setRescheduleSession(session)}
                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/15 transition-colors text-sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Reschedule
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(session.id)}
                      disabled={isBusy(session.id, 'cancel')}
                      className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 text-sm"
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
      ) : null}

      {/* Video Call Modal */}
      {activeMeetingSession && (
        <VideoMeetingModal
          isOpen={Boolean(activeMeetingSession)}
          onClose={() => setActiveMeetingSession(null)}
          jitsiRoomUrl={activeMeetingSession.jitsiRoomUrl}
          sessionTopic={activeMeetingSession.topic}
          peerName={otherPerson(activeMeetingSession)?.name || 'Mentorship Partner'}
          peerRole={getRoleLabel(activeMeetingSession) === 'Junior' ? 'Mentor' : 'Mentee'}
          isMentor={getRoleLabel(activeMeetingSession) === 'Senior'}
          onCompleteSession={() => handleCompleteSession(activeMeetingSession.id)}
        />
      )}

      {/* Real-time Session Chat Modal */}
      {activeChatSession && (
        <SessionChatModal
          isOpen={Boolean(activeChatSession)}
          onClose={() => setActiveChatSession(null)}
          sessionId={activeChatSession.id}
          sessionTopic={activeChatSession.topic}
          peerName={otherPerson(activeChatSession)?.name || 'User'}
          peerAvatar={otherPerson(activeChatSession)?.avatar}
          peerRole={getRoleLabel(activeChatSession) === 'Junior' ? 'Senior Mentor' : 'Junior Mentee'}
        />
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

      {rescheduleSession && (
        <RescheduleModal
          session={rescheduleSession}
          onClose={() => setRescheduleSession(null)}
          onRescheduled={() => {
            setRescheduleSession(null)
            fetchSessions()
          }}
        />
      )}
    </div>
  )
}
