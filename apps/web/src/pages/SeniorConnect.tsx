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

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Senior Connect</h1>
          <p className="mt-2 text-muted-foreground">Find and connect with experienced professionals</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/connect/profile"
            className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-colors"
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
            aria-label="Search mentors"
            placeholder="Search by name, company, or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select 
          aria-label="Filter mentors by domain"
          value={domain} 
          onChange={(e) => setDomain(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Domains</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Data">Data</option>
          <option value="DevOps">DevOps</option>
          <option value="Management">Management</option>
        </select>
      </div>

      {error && <div role="alert" aria-live="assertive" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><button type="button" onClick={fetchSeniors} className="font-semibold underline underline-offset-2">Try again</button></div>}

      {loading ? (
        <div role="status" aria-live="polite" className="flex min-h-64 items-center justify-center text-muted-foreground">Loading mentors…</div>
      ) : seniors.length === 0 && error ? null : seniors.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No mentors found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid gap-4" aria-live="polite" aria-label={`${seniors.length} mentors found`}>
          {seniors.map((senior) => (
            <div
              key={senior.id}
              className="flex flex-col sm:flex-row items-start gap-5 p-6 bg-card text-card-foreground rounded-2xl shadow-sm border border-border hover:border-primary/40 hover:shadow-md transition-all group"
            >
              {/* Mentor Avatar */}
              <div className="relative shrink-0">
                <img 
                  src={senior.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(senior.user?.name || 'Mentor')}&backgroundColor=4f46e5`} 
                  alt={senior.user?.name || 'Mentor'} 
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(senior.user?.name || 'Mentor')}&backgroundColor=4f46e5`
                  }}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-border/80 shadow-sm group-hover:border-primary/50 transition-colors"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-card rounded-full flex items-center justify-center text-white text-xs shadow-sm font-bold" title="Verified Alumni Mentor">
                  ✓
                </span>
              </div>

              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {senior.user?.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Alumni Mentor
                      </span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {senior.title} {senior.company ? `at ${senior.company}` : ''}
                    </p>
                    {senior.domain && (
                      <span className="inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {senior.domain}
                      </span>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-amber-500">
                        {senior.rating ? senior.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{senior.reviewCount || 0} reviews</p>
                  </div>
                </div>

                {senior.bio && (
                  <p className="mt-2.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{senior.bio}</p>
                )}

                {senior.expertise && senior.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {senior.expertise.slice(0, 5).map((skill) => (
                      <span key={skill} className="text-xs px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                        {skill}
                      </span>
                    ))}
                    {senior.expertise.length > 5 && (
                      <span className="text-xs px-2 py-0.5 text-muted-foreground">
                        +{senior.expertise.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  {senior.experience > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {senior.experience} yrs exp
                    </span>
                  )}
                  {senior.location && (
                    <span>📍 {senior.location}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getAvailabilityBadge(senior.availability)}`}>
                    {senior.availability}
                  </span>
                </div>
              </div>

              <div className="sm:self-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => navigate(`/connect/booking/${senior.id}`)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
