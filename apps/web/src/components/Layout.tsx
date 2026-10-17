import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageSquare, Code, Users, LogOut, Bell, Moon, Sun, Map, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import NotificationsPanel from './NotificationsPanel'
import { DarkModeProvider, useDarkMode } from '../contexts/DarkModeContext'

function LayoutContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('careerhub-sidebar-collapsed') === 'true')
  const { darkMode, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const settingsPath = user.role === 'MENTOR' ? '/mentor/settings' : '/settings'

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('careerhub-sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

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
            <Link to={user.role === 'MENTOR' ? '/mentor' : '/'} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CH</span>
              </div>
              <span className="text-xl font-bold text-foreground">CareerHub</span>
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
