import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Code, Users } from 'lucide-react'

interface DashboardStats {
  resumesCount: number
  interviewsCount: number
  problemsCount: number
  connectCount: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    resumesCount: 0,
    interviewsCount: 0,
    problemsCount: 0,
    connectCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch actual stats from implemented modules
      const resumesResponse = await fetch('/api/resume', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const resumesData = await resumesResponse.json()
      
      const connectResponse = await fetch('/api/connect/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const connectData = await connectResponse.json()
      
      setStats({
        resumesCount: resumesData.length || 0,
        interviewsCount: 0, // Not implemented yet
        problemsCount: 0, // Not implemented yet
        connectCount: connectData.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    { label: 'Resumes Created', value: stats.resumesCount, icon: FileText, color: 'bg-blue-500' },
    { label: 'Interviews Taken', value: stats.interviewsCount, icon: MessageSquare, color: 'bg-green-500' },
    { label: 'Problems Solved', value: stats.problemsCount, icon: Code, color: 'bg-purple-500' },
    { label: 'Connect Sessions', value: stats.connectCount, icon: Users, color: 'bg-orange-500' },
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
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          )
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to CareerHub</h2>
        <p className="text-gray-600">
          Your unified platform for interview preparation. Get started by creating your first resume or connecting with senior mentors.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/resume" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Create Resume</p>
              <p className="text-sm text-gray-600">Build your professional resume</p>
            </div>
          </a>
          <a href="/connect" className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Users className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-gray-900">Find Mentors</p>
              <p className="text-sm text-gray-600">Connect with senior professionals</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}