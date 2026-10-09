import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Search, Calendar, Star, Award } from 'lucide-react'

interface Senior {
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
  availability: string
  user: {
    id: string
    name: string
    avatar: string
    title: string
    company: string
    credibilityScore: number
  }
}

export default function SeniorConnect() {
  const navigate = useNavigate()
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSeniors()
  }, [search, domain])

  const fetchSeniors = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (domain) params.append('domain', domain)

      const response = await fetch(`/api/connect/seniors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch seniors')
      }

      const data = await response.json()
      setSeniors(data)
      setError('')
    } catch (error) {
      console.error('Failed to fetch seniors:', error)
      setError('Failed to load seniors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getAvailabilityBadge = (availability: string) => {
    const config: Record<string, string> = {
      available: 'bg-green-50 text-green-700',
      limited: 'bg-yellow-50 text-yellow-700',
      booked: 'bg-red-50 text-red-700'
    }
    return config[availability] || 'bg-gray-50 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading seniors...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Senior Connect</h1>
          <p className="text-gray-600 mt-2">Find and connect with experienced professionals</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/connect/profile"
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Award className="w-4 h-4" />
            Mentor Profile
          </Link>
          <Link
            to="/connect/sessions"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            My Sessions
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select 
          value={domain} 
          onChange={(e) => setDomain(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Domains</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Data">Data</option>
          <option value="DevOps">DevOps</option>
          <option value="Management">Management</option>
        </select>
      </div>

      {seniors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {seniors.map((senior) => (
            <div
              key={senior.id}
              className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <img 
                src={senior.user.avatar || '/default-avatar.png'} 
                alt={senior.user.name} 
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{senior.user.name}</h3>
                    <p className="text-sm text-gray-600">{senior.title} at {senior.company}</p>
                    {senior.domain && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {senior.domain}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {senior.rating ? senior.rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{senior.reviewCount} reviews</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{senior.bio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {senior.expertise.slice(0, 4).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {senior.experience} years experience
                  </span>
                  <span>{senior.location}</span>
                  <span className={`px-2 py-1 rounded-full ${getAvailabilityBadge(senior.availability)}`}>
                    {senior.availability}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/connect/booking/${senior.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}