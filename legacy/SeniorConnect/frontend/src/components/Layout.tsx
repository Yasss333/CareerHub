import { useApp } from '@/store';
import { LogOut, Home, Search, BookOpen, User } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { navigate, isAuthed, logout } = useApp();

  if (!isAuthed) return <>{children}</>;

  return (
    <div className="flex h-screen flex-col bg-secondary-50">
      <nav className="border-b border-secondary-200 bg-white shadow-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('dashboard')} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
              SC
            </div>
            <span className="font-display text-lg font-bold text-secondary-900">SeniorConnect</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate('dashboard')} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100">
              <Home className="h-4 w-4" /> Dashboard
            </button>
            <button onClick={() => navigate('discover')} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100">
              <Search className="h-4 w-4" /> Discover
            </button>
            <button onClick={() => navigate('bookings')} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100">
              <BookOpen className="h-4 w-4" /> Sessions
            </button>
            <button onClick={() => navigate('profile')} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100">
              <User className="h-4 w-4" /> Profile
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
