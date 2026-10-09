import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Calendar, Clock, MessageSquare, X, Star } from 'lucide-react'

interface SeniorProfile {
  id: string
  title: string
  company: string
  domain: string
  bio: string
  experience: number
  location: string
  expertise: string[]
  rating: number
  reviewCount: number
  availability: string
  user: {
    id: string
    name: string
    avatar: string
  }
}

interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  booked: boolean
}

const toDateInputValue = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SeniorConnectBooking() {
  const navigate = useNavigate()
  const { seniorId } = useParams()

  const [senior, setSenior] = useState<SeniorProfile | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [duration, setDuration] = useState(45)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!seniorId) return
    const load = async () => {
      try {
        const token = localStorage.getItem('token')
        const [seniorRes, slotsRes] = await Promise.all([
          fetch(`/api/connect/seniors/${seniorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/connect/availability/${seniorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (!seniorRes.ok) throw new Error('Failed to load mentor')
        const seniorData = await seniorRes.json()
        setSenior(seniorData.profile)

        if (slotsRes.ok) {
          const slotData = await slotsRes.json()
          setSlots(slotData.filter((s: Slot) => !s.booked))
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load mentor. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seniorId])

  const availableSlots = slots

  const groupedSlots = availableSlots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = toDateInputValue(slot.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlotId(slot.id)
    const start = new Date(`${toDateInputValue(slot.date)}T${slot.startTime}`)
    const end = new Date(`${toDateInputValue(slot.date)}T${slot.endTime}`)
    const mins = Math.round((end.getTime() - start.getTime()) / 60000)
    if (mins > 0) setDuration(Math.min(Math.max(mins, 15), 120))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    let scheduledTime: string
    let availabilitySlotId: string | undefined
    let dur = duration

    if (selectedSlotId) {
      const slot = slots.find((s) => s.id === selectedSlotId)
      if (!slot) return
      scheduledTime = `${toDateInputValue(slot.date)}T${slot.startTime}`
      availabilitySlotId = slot.id
      const start = new Date(scheduledTime)
      const end = new Date(`${toDateInputValue(slot.date)}T${slot.endTime}`)
      dur = Math.round((end.getTime() - start.getTime()) / 60000)
    } else {
      if (!manualDate || !manualTime) {
        setError('Select an availability slot, or provide a date and time')
        return
      }
      scheduledTime = `${manualDate}T${manualTime}`
    }

    if (!topic) {
      setError('Please fill in the topic')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seniorId,
          availabilitySlotId,
          scheduledTime,
          duration: dur,
          topic,
          notes
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to book session')
      }

      navigate('/connect/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!senior) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-600 mb-6">Mentor not found.</p>
        <Link to="/connect" className="text-blue-600 hover:text-blue-700">
          Back to Mentors
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/connect" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
          <X className="w-4 h-4" />
          Back to Mentors
        </Link>
      </div>

      <div className="flex items-center gap-4 p-5 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <img
          src={senior.user.avatar || '/default-avatar.png'}
          alt={senior.user.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{senior.user.name}</h1>
          <p className="text-sm text-gray-600">{senior.title} at {senior.company}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {senior.rating ? senior.rating.toFixed(1) : '0.0'} ({senior.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {senior.experience} yrs
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pick an available time slot
          </label>
          {availableSlots.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
              No availability slots right now. You can still request a time below and the mentor will confirm.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.keys(groupedSlots).sort().map((key) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {new Date(`${key}T00:00`).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {groupedSlots[key]
                      .slice()
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                            selectedSlotId === slot.id
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Or enter a custom time (mentor will confirm)
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => { setManualDate(e.target.value); setSelectedSlotId('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="time"
              value={manualTime}
              onChange={(e) => { setManualTime(e.target.value); setSelectedSlotId('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
          <select
            value={duration}
            disabled={!!selectedSlotId}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
          {selectedSlotId && (
            <p className="text-xs text-gray-500 mt-1">Duration is set from the selected slot.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Career advice, Technical interview prep"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Booking...' : 'Book Session'}
        </button>
      </form>
    </div>
  )
}