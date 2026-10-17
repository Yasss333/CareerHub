import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'MENTOR'
  isAlumniMentor: boolean
  createdAt: string
}

interface AuthResponse {
  user: User
  token: string
  error?: string
}

export default function Login() {
  const [accountType, setAccountType] = useState<User['role']>('USER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, accountType }),
      })

      const data: AuthResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token and user data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Navigate to dashboard
      navigate(data.user.role === 'MENTOR' ? '/mentor' : '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CareerHub</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Sign in as
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['USER', 'User'],
                  ['ADMIN', 'Admin'],
                  ['MENTOR', 'Mentor'],
                ] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                      accountType === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={value}
                      checked={accountType === value}
                      onChange={() => setAccountType(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Mentor access is available after administrator approval.
              </p>
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:text-primary font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}