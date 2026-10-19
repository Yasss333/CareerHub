import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  feedback: { rating?: number; mentorFeedback?: { rating: number; comment?: string } } | null
  liveParticipants?: { identity: string; name: string }[]
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
      algoRankIncluded: boolean
      resumeScore: number
      resumesCount: number
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
  isMentor: boolean
  onClose: () => void
  onSubmitted: () => void
}

function FeedbackModal({ session, isMentor, onClose, onSubmitted }: FeedbackModalProps) {
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
          <h3 className="text-lg font-semibold text-gray-900">{isMentor ? 'Student Feedback' : 'Leave Feedback'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isMentor ? `Share feedback about ${session.junior.name}'s session.` : `How was your session with ${session.senior.name}?`}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{isMentor ? 'Student performance *' : 'Rating *'}</label>
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
              placeholder={isMentor ? 'Share constructive feedback for the student...' : 'What did you like? What could be improved?'}
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
  const [searchParams, setSearchParams] = useSearchParams()
  const joinParam = searchParams.get('join')

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // Soft notification audio chime when meeting starts
  const playMeetingStartedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // Audio autoplay policy
    }
  }

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

  // Real-time background polling every 4 seconds without re-triggering loading spinner
  const fetchSessionsSilently = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const response = await fetch(`/api/connect/sessions${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) return
      const data: Session[] = await response.json()
      
      setSessions((prevSessions) => {
        const newlyStarted = data.find(
          (newS) => newS.status === 'started' && prevSessions.some((oldS) => oldS.id === newS.id && oldS.status !== 'started')
        )
        if (newlyStarted) {
          playMeetingStartedChime()
        }
        return data
      })
    } catch {
      // ignore silent poll failure
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [statusFilter])

  useEffect(() => {
    const pollInterval = setInterval(fetchSessionsSilently, 4000)
    return () => clearInterval(pollInterval)
  }, [statusFilter])

  // Handle direct join link (e.g. from global banner notification)
  useEffect(() => {
    if (joinParam && sessions.length > 0) {
      const matched = sessions.find((s) => s.id === joinParam)
      if (matched) {
        handleJoinCall(matched)
        searchParams.delete('join')
        setSearchParams(searchParams, { replace: true })
      }
    }
  }, [joinParam, sessions])

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

  const getStatusBadge = (status: string, role?: 'Junior' | 'Senior', liveParticipants: Session['liveParticipants'] = []) => {
    if (status === 'started') {
      const otherParticipantPresent = liveParticipants.some((participant) => participant.identity !== currentUser.id)
      const currentParticipantPresent = liveParticipants.some((participant) => participant.identity === currentUser.id)
      const message = otherParticipantPresent
        ? role === 'Junior' ? 'Mentor in call' : 'Candidate in call'
        : currentParticipantPresent
          ? role === 'Junior' ? 'Waiting for mentor' : 'Waiting for candidate'
          : 'Room reconnecting'
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {message}
        </span>
      )
    }

    const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
      pending: { color: 'bg-yellow-50 text-yellow-700', icon: Clock },
      accepted: { color: 'bg-primary/5 text-primary', icon: CheckCircle },
      rejected: { color: 'bg-red-50 text-red-700', icon: XCircle },
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

  const liveStartedSession = sessions.find((s) => s.status === 'started' && (s.liveParticipants?.length ?? 0) > 0)

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

      {/* Real-time Meeting Started Notification Alert Banner */}
      {liveStartedSession && activeMeetingSession?.id !== liveStartedSession.id && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-5 shadow-xl border border-emerald-400/40 animate-pulse">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                  <Video className="w-7 h-7 animate-bounce" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white text-emerald-800 uppercase tracking-wider shadow-xs">
                    Live Call Started
                  </span>
                  <span className="text-xs text-emerald-100 font-medium">
                    {liveStartedSession.liveParticipants?.some((participant) => participant.identity === otherPerson(liveStartedSession)?.id)
                      ? `${otherPerson(liveStartedSession)?.name || 'Your session partner'} is in the video room.`
                      : getRoleLabel(liveStartedSession) === 'Junior'
                        ? 'Waiting for your mentor to join the video room.'
                        : 'Waiting for the candidate to join the video room.'}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
                  {liveStartedSession.topic}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Meeting with <strong className="text-white">{otherPerson(liveStartedSession)?.name}</strong> • Scheduled at {new Date(liveStartedSession.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleJoinCall(liveStartedSession)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Video className="w-5 h-5 text-emerald-600 animate-pulse" />
                Start Meet / Join Now
              </button>
            </div>
          </div>
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
                className={`rounded-2xl shadow-sm border p-6 transition-all ${
                  session.status === 'started'
                    ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-card border-emerald-500/40 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={peer?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer?.name || 'User')}&backgroundColor=4f46e5`}
                      alt={peer?.name}
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer?.name || 'User')}&backgroundColor=4f46e5`
                      }}
                      className="h-12 w-12 rounded-full object-cover border border-border shadow-sm"
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
                    {getStatusBadge(session.status, role, session.liveParticipants)}
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

                    <div className={`grid ${session.junior.pri.algoRankIncluded ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-xs`}>
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <div className="text-muted-foreground">Mock Interview</div>
                        <div className="font-semibold text-foreground text-sm">{session.junior.pri.interviewAvg}%</div>
                        <div className="text-[10px] text-muted-foreground">{session.junior.pri.interviewCount} sessions</div>
                      </div>
                      {session.junior.pri.algoRankIncluded && <div className="p-2 rounded-lg bg-card border border-border">
                        <div className="text-muted-foreground">AlgoRank DSA</div>
                        <div className="font-semibold text-foreground text-sm">{session.junior.pri.dsaScore}%</div>
                        <div className="text-[10px] text-muted-foreground">{session.junior.pri.problemsSolved} solved</div>
                      </div>}
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

                  {/* Video Call Button with Reactive Start Meet states */}
                  {session.status === 'started' && (
                    <button
                      onClick={() => handleJoinCall(session)}
                      disabled={isBusy(session.id, 'start')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all disabled:opacity-50 text-sm font-bold shadow-lg shadow-emerald-600/30 animate-pulse cursor-pointer"
                    >
                      <Video className="w-4 h-4 animate-bounce" />
                      {role === 'Junior' ? 'Start Meet / Join Now' : 'Re-enter Live Call'}
                    </button>
                  )}

                  {session.status === 'accepted' && (
                    <button
                      onClick={() => handleJoinCall(session)}
                      disabled={isBusy(session.id, 'start')}
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium shadow-xs cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      {role === 'Senior' ? 'Start Video Call' : 'Join Video Call'}
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

                  {role === 'Junior' && session.status === 'completed' && !session.feedback?.rating && (
                    <button
                      onClick={() => setFeedbackSession(session)}
                      className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      Leave Feedback
                    </button>
                  )}

                  {role === 'Senior' && session.status === 'completed' && !session.feedback?.mentorFeedback && (
                    <button
                      onClick={() => setFeedbackSession(session)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/15 transition-colors text-sm"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      Give Student Feedback
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
          sessionId={activeMeetingSession.id}
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
          isMentor={getRoleLabel(feedbackSession) === 'Senior'}
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
