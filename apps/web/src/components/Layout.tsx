import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageSquare, Code, Users, LogOut, Bell, Moon, Sun, Map, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen, Video, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationsPanel from './NotificationsPanel'
import ReportFeedback from './ReportFeedback'
import CareerHubLogo from './CareerHubLogo'
import { DarkModeProvider, useDarkMode } from '../contexts/DarkModeContext'

function LayoutContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('careerhub-sidebar-collapsed') === 'true')
  const [liveMeeting, setLiveMeeting] = useState<{ id: string; topic: string; mentorName: string } | null>(null)
  const [dismissedMeetingId, setDismissedMeetingId] = useState<string | null>(null)
  const { darkMode, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const settingsPath = user.role === 'ADMIN' ? '/admin/settings' : user.role === 'MENTOR' ? '/mentor/settings' : '/settings'
  const feedbackPath = user.role === 'MENTOR' ? '/mentor/feedback' : user.role === 'ADMIN' ? '/admin/feedback' : '/feedback'
  const isNonSoftwareSpecialization = ['ELECTRONICS_ELECTRICAL', 'OTHER_ENGINEERING'].includes(user.specialization)

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('careerhub-sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || user.role === 'ADMIN') return

    const checkLiveMeetings = async () => {
      try {
        const res = await fetch('/api/connect/sessions?status=started', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const sessions: Array<{id: string; topic: string; status: string; liveParticipants?: unknown[]; junior?: {id: string; name?: string}; senior?: {id: string; name?: string}}> = await res.json()
        if (Array.isArray(sessions) && sessions.length > 0) {
          const active = sessions.find((s) => s.status === 'started' && s.liveParticipants?.length > 0)
          if (active) {
            const isJunior = active.junior?.id === user.id
            const peerName = isJunior ? active.senior?.name : active.junior?.name
            setLiveMeeting({
              id: active.id,
              topic: active.topic,
              mentorName: peerName || 'Mentor'
            })
          }
          else setLiveMeeting(null)
        } else {
          setLiveMeeting(null)
        }
      } catch {
        // silent
      }
    }

    checkLiveMeetings()
    const timer = setInterval(checkLiveMeetings, 5000)
    return () => clearInterval(timer)
  }, [user.id, user.role])

  const navItems = user.role === 'ADMIN' && location.pathname.startsWith('/admin') ? [
    {path: '/admin', label: 'Admin overview', icon: ShieldCheck},
    {path: '/admin/users', label: 'People', icon: Users},
    {path: '/admin/mentors', label: 'Mentors', icon: Users},
    {path: '/admin/mentor-applications', label: 'Mentor applications', icon: ShieldCheck},
    {path: '/admin/interviews', label: 'Interview activity', icon: Video},
    {path: '/admin/progress', label: 'Learning progress', icon: Map},
    {path: '/admin/feedback', label: 'User feedback', icon: MessageSquare},
    {path: '/admin/problems', label: 'Problem library', icon: Code},
    {path: '/admin/audit', label: 'Admin activity', icon: FileText},
    {path: '/', label: 'Candidate workspace', icon: Home},
  ] : user.role === 'MENTOR'
    ? [
        { path: '/mentor', label: 'Mentor sessions', icon: Users },
        { path: '/mentor/profile', label: 'Mentor profile', icon: Users },
        { path: feedbackPath, label: 'My feedback', icon: MessageSquare },
      ]
    : [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/resume', label: 'Resume Builder', icon: FileText },
    { path: '/connect', label: 'Senior Connect', icon: Users },
    { path: '/interview', label: 'AI Interview', icon: MessageSquare },
    ...(!isNonSoftwareSpecialization ? [{ path: '/algorank', label: 'AlgoRank', icon: Code }] : []),
    { path: '/roadmaps', label: 'Roadmaps', icon: Map },
    { path: feedbackPath, label: user.role === 'ADMIN' ? 'User feedback' : 'My feedback', icon: MessageSquare },
    ...(user.role === 'ADMIN'
      ? [{ path: '/admin/mentor-applications', label: 'Admin review', icon: ShieldCheck }]
      : []),
    ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-border bg-card px-4 py-3 text-card-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary md:inline-flex"
              title={sidebarCollapsed ? 'Expand dashboard sidebar' : 'Collapse dashboard sidebar'}
              aria-label={sidebarCollapsed ? 'Expand dashboard sidebar' : 'Collapse dashboard sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <Link to={user.role === 'ADMIN' ? '/admin' : user.role === 'MENTOR' ? '/mentor' : '/'} aria-label="CareerHub home" className="flex items-center gap-2">
              <CareerHubLogo />
              <span className="hidden text-xl font-bold text-foreground min-[360px]:inline">CareerHub</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <span className="hidden text-sm text-muted-foreground sm:inline">Welcome, {user.name || 'User'}</span>
            <ReportFeedback historyPath={feedbackPath} />
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Real-time Global Live Meeting Alert Banner */}
      {liveMeeting && dismissedMeetingId !== liveMeeting.id && !location.pathname.includes('/connect/sessions') && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between z-40 animate-pulse">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span>
              <strong>Meeting Started!</strong> {liveMeeting.mentorName} started the video session for "{liveMeeting.topic}".
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/connect/sessions?join=${liveMeeting.id}`)}
              className="px-3.5 py-1 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" /> Start Meet / Join Now
            </button>
            <button
              onClick={() => setDismissedMeetingId(liveMeeting.id)}
              className="p-1 hover:bg-white/20 rounded-md text-white/80 hover:text-white"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`hidden min-h-screen shrink-0 border-r border-border bg-card p-3 text-card-foreground transition-[width] duration-200 md:flex md:flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg py-3 transition-colors ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} ${
                    isActive
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto space-y-2 border-t border-border pt-3">
            <button
              onClick={toggleSidebar}
              className={`flex w-full items-center rounded-lg py-3 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'}`}
              title={sidebarCollapsed ? 'Expand dashboard sidebar' : 'Collapse dashboard sidebar'}
              aria-label={sidebarCollapsed ? 'Expand dashboard sidebar' : 'Collapse dashboard sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              {!sidebarCollapsed && <span>Collapse sidebar</span>}
            </button>
            <Link
              to={settingsPath}
              title={sidebarCollapsed ? 'Settings' : undefined}
              className={`flex items-center rounded-lg py-3 transition-colors ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} ${location.pathname === settingsPath ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
              <Settings className="h-5 w-5" />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
          </div>
        </aside>

        <nav
          aria-label="Primary navigation"
          className="flex min-w-0 gap-1 overflow-x-auto border-b border-border bg-card p-2 text-card-foreground md:hidden"
        >
          {[...navItems, { path: settingsPath, label: 'Settings', icon: Settings }].map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
