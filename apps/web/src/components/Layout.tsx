import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageSquare, Code, Users, LogOut, Bell, Moon, Sun, Map, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import NotificationsPanel from './NotificationsPanel'
import { DarkModeProvider, useDarkMode } from '../contexts/DarkModeContext'

function LayoutContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const navItems = user.role === 'MENTOR'
    ? [
        { path: '/mentor', label: 'Mentor sessions', icon: Users },
        { path: '/mentor/profile', label: 'Mentor profile', icon: Users },
      ]
    : [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/resume', label: 'Resume Builder', icon: FileText },
    { path: '/connect', label: 'Senior Connect', icon: Users },
    { path: '/interview', label: 'AI Interview', icon: MessageSquare },
    { path: '/algorank', label: 'AlgoRank', icon: Code },
    { path: '/roadmaps', label: 'Roadmaps', icon: Map },
    ...(user.role === 'ADMIN'
      ? [{ path: '/admin/mentor-applications', label: 'Admin review', icon: ShieldCheck }]
      : []),
    ]

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className={`border-b px-4 py-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CH</span>
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>CareerHub</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative text-gray-600 hover:text-gray-900"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <span className={`hidden text-sm sm:inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Welcome, {user.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-w-0 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`hidden w-64 shrink-0 border-r min-h-screen p-4 md:block ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <nav
          aria-label="Primary navigation"
          className={`flex min-w-0 gap-1 overflow-x-auto border-b p-2 md:hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  )
}

export default function Layout() {
  return (
    <DarkModeProvider>
      <LayoutContent />
    </DarkModeProvider>
  )
}