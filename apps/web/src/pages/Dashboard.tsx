import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MessageSquare, Code, Users, Calendar, TrendingUp, Award, Target, ChevronRight } from 'lucide-react'

interface DashboardStats {
  resumesCount: number
  interviewsCount: number
  problemsSolved: number
  totalProblems: number
  connectSessions: number
  upcomingSessions: number
  userRank?: number
  acceptanceRate?: number
  currentStreak?: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    resumesCount: 0,
    interviewsCount: 0,
    problemsSolved: 0,
    totalProblems: 0,
    connectSessions: 0,
    upcomingSessions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch resumes
      const resumesResponse = await fetch('/api/resume', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const resumesData = await resumesResponse.json()
      const resumesCount = Array.isArray(resumesData) ? resumesData.length : 0

      // Fetch sessions
      const connectResponse = await fetch('/api/connect/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const connectData = await connectResponse.json()
      const connectSessions = Array.isArray(connectData) ? connectData : []
      const upcomingSessions = connectSessions.filter((s: any) =>
        ['pending', 'accepted'].includes(s.status) && new Date(s.scheduledTime) > new Date()
      ).length

      // Fetch user stats (for AlgoRank)
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const userData = await userResponse.json()

      // Fetch total problems count
      const problemsResponse = await fetch('/api/algorank/problems?limit=1')
      const problemsData = await problemsResponse.json()
      const totalProblems = problemsData.pagination?.totalProblems || 0

      setStats({
        resumesCount,
        interviewsCount: 0,
        problemsSolved: userData.totalProblemsSolved || 0,
        totalProblems,
        connectSessions: connectSessions.length,
        upcomingSessions,
        userRank: userData.rankingScore || undefined,
        acceptanceRate: userData.acceptanceRate || undefined,
        currentStreak: userData.currentStreak || undefined,
      })

      setRecentSessions(connectSessions.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    { label: 'Resumes Created', value: stats.resumesCount, icon: FileText, color: 'bg-blue-500', link: '/resume' },
    { label: 'Problems Solved', value: `${stats.problemsSolved}/${stats.totalProblems}`, icon: Code, color: 'bg-purple-500', link: '/algorank' },
    { label: 'Mentorship Sessions', value: stats.connectSessions, icon: Users, color: 'bg-orange-500', link: '/connect/sessions' },
    { label: 'Upcoming Sessions', value: stats.upcomingSessions, icon: Calendar, color: 'bg-green-500', link: '/connect/sessions' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} to={stat.link} className="block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* AlgoRank Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Acceptance Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.acceptanceRate?.toFixed(1) || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.currentStreak || 0} days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Ranking Score</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.userRank?.toFixed(0) || 0}</p>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
            <Link to="/connect/sessions" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.topic}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.scheduledTime).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  session.status === 'completed' ? 'bg-green-100 text-green-700' :
                  session.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                  session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/resume" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Create Resume</p>
              <p className="text-sm text-gray-600">Build your professional resume</p>
            </div>
          </Link>
          <Link to="/connect" className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Users className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-gray-900">Find Mentors</p>
              <p className="text-sm text-gray-600">Connect with senior professionals</p>
            </div>
          </Link>
          <Link to="/algorank" className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Code className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">Practice Problems</p>
              <p className="text-sm text-gray-600">Solve DSA challenges</p>
            </div>
          </Link>
          <Link to="/algorank/leaderboard" className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <Award className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-gray-900">Leaderboard</p>
              <p className="text-sm text-gray-600">Check your ranking</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}