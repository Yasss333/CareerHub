import { useState } from 'react';
import { useApp } from '@/store';
import type { ViewName } from '@/types';
import {
  Home,
  Compass,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from 'lucide-react';

interface NavItem {
  view: ViewName;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: Home },
  { view: 'discover', label: 'Discover', icon: Compass },
  { view: 'bookings', label: 'Bookings', icon: Calendar },
  { view: 'session', label: 'Sessions', icon: MessageSquare },
  { view: 'profile', label: 'Profile', icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { view, navigate, logout, savedSeniorIds, sessions } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const upcomingCount = sessions.filter((s) => s.status === 'upcoming').length;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
          <Compass className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-display text-base font-bold text-secondary-800">
            SeniorConnect
          </span>
          <p className="text-[11px] font-medium text-secondary-400">by CareerHub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = view === item.view || (item.view === 'session' && view === 'feedback');
          return (
            <button
              key={item.view}
              onClick={() => {
                navigate(item.view);
                setMobileOpen(false);
              }}
              className={`nav-link w-full ${isActive ? 'nav-link-active' : ''}`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span>{item.label}</span>
              {item.view === 'bookings' && upcomingCount > 0 && (
                <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                  {upcomingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-secondary-100 p-3">
        <div className="mb-2 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-4">
          <p className="text-sm font-semibold text-primary-800">Need guidance?</p>
          <p className="mb-3 mt-0.5 text-xs text-primary-600">
            Find a mentor who matches your goals.
          </p>
          <button
            onClick={() => {
              navigate('discover');
              setMobileOpen(false);
            }}
            className="w-full rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Discover Seniors
          </button>
        </div>
        <button onClick={logout} className="nav-link w-full text-error-600 hover:bg-error-50 hover:text-error-700">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-secondary-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-secondary-900/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-secondary-200 bg-white animate-slide-in-right lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-secondary-400 hover:bg-secondary-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-secondary-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden flex-1 sm:block sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search seniors, companies, skills..."
              className="input pl-10"
              onFocus={() => navigate('discover')}
              readOnly
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-2.5 text-secondary-500 transition-colors hover:bg-secondary-100">
              <Bell className="h-5 w-5" />
              {upcomingCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500" />
              )}
            </button>
            <button
              onClick={() => navigate('profile')}
              className="flex items-center gap-2 rounded-xl p-1 pr-3 transition-colors hover:bg-secondary-100"
            >
              <img
                src="https://api.dicebear.com/7.x/initials/svg?seed=Rohan%20Verma&backgroundColor=f59e0b&textColor=ffffff"
                alt="Profile"
                className="h-8 w-8 rounded-lg"
              />
              <span className="hidden text-sm font-medium text-secondary-700 sm:block">Rohan</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
