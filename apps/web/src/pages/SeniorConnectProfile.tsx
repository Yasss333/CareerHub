import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Save, Plus, Trash2, Calendar, Clock, X } from 'lucide-react'

interface SeniorProfile {
  id: string
  title: string
  company: string
  domain: string
  role: string
  bio: string
  experience: number
  location: string
  expertise: string[]
  achievements: string[]
  rating: number
  reviewCount: number
  sessionCount: number
  availability: string
  user: {
    id: string
    name: string
    email: string
    avatar: string
    isAlumniMentor: boolean
  }
}

interface AvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

function TagInput({ value, onChange, placeholder }: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [text, setText] = useState(value.join(', '))

  useEffect(() => {
    setText(value.join(', '))
  }, [value])

  const handleBlur = () => {
    const tags = text.split(',').map((t) => t.trim()).filter(Boolean)
    onChange(tags)
    setText(tags.join(', '))
  }

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

export default function SeniorConnectProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<SeniorProfile | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingSlot, setAddingSlot] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    avatar: '',
    title: '',
    company: '',
    domain: '',
    role: '',
    bio: '',
    experience: 0,
    location: '',
    expertise: [] as string[],
    achievements: [] as string[],
    availability: 'available'
  })

  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.status === 404) {
        setHasProfile(false)
        setProfile(null)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch profile')

      const data = await response.json()
      setProfile(data)
      setHasProfile(true)
      setForm({
        name: data.user?.name || '',
        avatar: data.user?.avatar || '',
        title: data.title || '',
        company: data.company || '',
        domain: data.domain || '',
        role: data.role || '',
        bio: data.bio || '',
        experience: data.experience || 0,
        location: data.location || '',
        expertise: data.expertise || [],
        achievements: data.achievements || [],
        availability: data.availability || 'available'
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load your mentor profile.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchSlots = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/availability', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch availability')
      const data = await response.json()
      setSlots(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load availability slots.')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (hasProfile) fetchSlots()
  }, [hasProfile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          experience: Number(form.experience) || 0,
          name: form.name || undefined
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save profile')
      }
      setSuccess('Mentor profile saved successfully')
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingSlot(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSlot)
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to add slot')
      }
      setNewSlot({ date: '', startTime: '', endTime: '' })
      setSuccess('Availability slot added')
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slot')
    } finally {
      setAddingSlot(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/availability/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete slot')
      }
      setSlots((prev) => prev.filter((s) => s.id !== id))
      setSuccess('Slot deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const groupedSlots = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    const key = dateKey(slot.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/connect" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
          <X className="w-4 h-4" />
          Back to Mentors
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {hasProfile ? 'Mentor Profile' : 'Become a Mentor'}
          </h1>
          <p className="text-gray-600 mt-2">
            {hasProfile
              ? 'Manage your public profile and availability'
              : 'Create your profile to start accepting mentorship sessions'}
          </p>
        </div>
        {hasProfile && (
          <div className="flex items-center gap-4 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <span className="font-semibold text-gray-900">{profile?.rating?.toFixed(1) ?? '0.0'}</span> rating
            </div>
            <div>
              <span className="font-semibold text-gray-900">{profile?.reviewCount ?? 0}</span> reviews
            </div>
            <div>
              <span className="font-semibold text-gray-900">{profile?.sessionCount ?? 0}</span> sessions
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile Details</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
            <input
              type="text"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
            <input
              type="text"
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g., Tech Company"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select domain</option>
              <option value="Backend">Backend</option>
              <option value="Frontend">Frontend</option>
              <option value="Data">Data</option>
              <option value="DevOps">DevOps</option>
              <option value="Management">Management</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tech Role</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g., Backend Engineer"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <input
              type="number"
              min={0}
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Bengaluru, India"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            placeholder="Tell juniors about your experience and how you can help..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expertise (comma separated)
          </label>
          <TagInput
            value={form.expertise}
            onChange={(tags) => setForm({ ...form, expertise: tags })}
            placeholder="e.g., System Design, React, Career Advice"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Achievements (comma separated)
          </label>
          <TagInput
            value={form.achievements}
            onChange={(tags) => setForm({ ...form, achievements: tags })}
            placeholder="e.g., Ex-Google, GSoC Mentor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
          <select
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="booked">Booked</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : hasProfile ? 'Save Profile' : 'Create Mentor Profile'}
          </button>
        </div>
      </form>

      {hasProfile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Availability Slots
            </h2>
          </div>

          <form onSubmit={handleAddSlot} className="grid md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start *</label>
              <input
                type="time"
                required
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End *</label>
              <input
                type="time"
                required
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={addingSlot}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                {addingSlot ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </form>

          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No availability slots yet. Add some above so juniors can book you.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedSlots).sort().map((key) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {formatDate(key)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {groupedSlots[key]
                      .slice()
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                            slot.isBooked
                              ? 'bg-gray-50 border-gray-200 text-gray-400'
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                          {slot.isBooked ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                              booked
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-blue-400 hover:text-red-600"
                              title="Delete slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function dateKey(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}