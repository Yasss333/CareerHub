import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, GraduationCap, Sparkles } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'MENTOR'
  isAlumniMentor: boolean
  specialization?: 'CS_SOFTWARE' | 'ELECTRONICS_ELECTRICAL' | 'OTHER_ENGINEERING' | null
  createdAt: string
}

interface AuthResponse {
  user: User
  token: string
  error?: string
}

export default function Register() {
  const [role, setRole] = useState<'USER' | 'MENTOR'>('USER')
  const [specialization, setSpecialization] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, ...(role === 'USER' ? { specialization } : {}) }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Navigate to appropriate home: Mentors go to mentor onboarding/profile, Candidates go to dashboard
      if (data.user.role === 'MENTOR') {
        navigate('/mentor/profile', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CareerHub</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to join as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-left transition-all ${
                    role === 'USER'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <GraduationCap className="w-6 h-6 mb-1.5" />
                  <span className="text-sm font-semibold">Candidate / Student</span>
                  <span className="text-[11px] text-gray-500 text-center mt-0.5">
                    Prepare, practice & get mentorship
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('MENTOR')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-left transition-all ${
                    role === 'MENTOR'
                      ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <UserCheck className="w-6 h-6 mb-1.5" />
                  <span className="text-sm font-semibold flex items-center gap-1">
                    Senior / Mentor
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  <span className="text-[11px] text-gray-500 text-center mt-0.5">
                    Offer 1:1 sessions & guidance
                  </span>
                </button>
              </div>

              {role === 'MENTOR' && (
                <div className="mt-2.5 p-2.5 bg-primary/5 rounded-lg border border-primary/20 text-xs text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                  <span>
                    Complete your mentor profile after sign-up. An administrator will review your application before you can offer mentoring.
                  </span>
                </div>
              )}
            </div>

            {role === 'USER' && (
              <div>
                <label htmlFor="specialization" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Study specialization
                </label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>Select your area</option>
                  <option value="CS_SOFTWARE">Computer Science / Software</option>
                  <option value="ELECTRONICS_ELECTRICAL">Electronics / Electrical</option>
                  <option value="OTHER_ENGINEERING">Other Engineering</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder={role === 'MENTOR' ? 'e.g. Alex Johnson (Senior SDE)' : 'e.g. John Doe'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
            >
              {loading
                ? 'Creating account...'
                : role === 'MENTOR'
                ? 'Sign Up as Mentor'
                : 'Sign Up as Candidate'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}