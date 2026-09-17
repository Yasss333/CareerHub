import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Clock, MessageSquare, X } from 'lucide-react'

interface Senior {
  id: string
  user: {
    id: string
    name: string
    avatar: string
  }
  title: string
  company: string
}

export default function SeniorConnectBooking() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(
    location.state?.senior || null
  )
  const [bookingData, setBookingData] = useState({
    scheduledTime: '',
    duration: 45,
    topic: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // In a real app, this would come from route params or state
  const mockSenior: Senior = {
    id: '1',
    user: {
      id: '1',
      name: 'John Doe',
      avatar: '/default-avatar.png'
    },
    title: 'Senior Software Engineer',
    company: 'Tech Company'
  }

  const displaySenior = selectedSenior || mockSenior

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!bookingData.scheduledTime || !bookingData.topic) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seniorId: displaySenior.id,
          scheduledTime: bookingData.scheduledTime,
          duration: bookingData.duration,
          topic: bookingData.topic,
          notes: bookingData.notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to book session')
      }

      const session = await response.json()
      navigate('/connect/sessions')
    } catch (error) {
      console.error('Booking error:', error)
      setError('Failed to book session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/connect')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Back to Seniors
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h1>

        {displaySenior && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <img 
              src={displaySenior.user.avatar || '/default-avatar.png'} 
              alt={displaySenior.user.name} 
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="font-semibold text-gray-900">{displaySenior.user.name}</p>
              <p className="text-sm text-gray-600">{displaySenior.title} at {displaySenior.company}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              value={bookingData.scheduledTime}
              onChange={(e) => setBookingData({ ...bookingData, scheduledTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              value={bookingData.duration}
              onChange={(e) => setBookingData({ ...bookingData, duration: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              value={bookingData.topic}
              onChange={(e) => setBookingData({ ...bookingData, topic: e.target.value })}
              placeholder="e.g., Career advice, Technical interview prep"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={bookingData.notes}
              onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
              placeholder="Any specific questions or areas you'd like to focus on..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>Video call will be conducted via Jitsi Meet</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Book Session'}
          </button>
        </form>
      </div>
    </div>
  )
}