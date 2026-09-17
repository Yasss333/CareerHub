import { useState, useEffect } from 'react'
import { Calendar, Clock, Video, Star, MessageSquare, CheckCircle, XCircle } from 'lucide-react'

interface Session {
  id: string
  scheduledTime: string
  duration: number
  topic: string
  notes: string
  status: string
  jitsiRoomUrl: string
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

export default function SeniorConnectSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/sessions', {
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

  const handleStartSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const data = await response.json()
      // Open Jitsi meeting in new tab
      window.open(data.jitsiRoomUrl, '_blank')
    } catch (error) {
      console.error('Failed to start session:', error)
      setError('Failed to start session. Please try again.')
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to complete session')
      }

      // Refresh sessions
      fetchSessions()
    } catch (error) {
      console.error('Failed to complete session:', error)
      setError('Failed to complete session. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-50 text-yellow-700', icon: Clock },
      accepted: { color: 'bg-blue-50 text-blue-700', icon: CheckCircle },
      rejected: { color: 'bg-red-50 text-red-700', icon: XCircle },
      upcoming: { color: 'bg-green-50 text-green-700', icon: Calendar },
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
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Book your first session with a senior mentor</p>
          <a
            href="/connect"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Find Mentors
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={session.senior.avatar || '/default-avatar.png'}
                    alt={session.senior.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{session.topic}</h3>
                    <p className="text-sm text-gray-600">
                      with {session.senior.name} ({session.senior.title} at {session.senior.company})
                    </p>
                  </div>
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(session.scheduledTime).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(session.scheduledTime).toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.duration} minutes
                </span>
              </div>

              {session.notes && (
                <p className="text-sm text-gray-600 mb-4 italic">"{session.notes}"</p>
              )}

              <div className="flex gap-2">
                {session.status === 'accepted' && (
                  <button
                    onClick={() => handleStartSession(session.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Start Meeting
                  </button>
                )}
                {session.status === 'started' && (
                  <button
                    onClick={() => handleCompleteSession(session.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Session
                  </button>
                )}
                {session.status === 'completed' && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Leave Feedback
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}