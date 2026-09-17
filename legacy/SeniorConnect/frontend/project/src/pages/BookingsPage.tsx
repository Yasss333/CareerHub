import { useState } from 'react';
import { useApp } from '@/store';
import { seniors } from '@/mockData';
import { EmptyState } from '@/components/ui';
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Compass,
  CalendarClock,
  History,
} from 'lucide-react';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function BookingsPage() {
  const { sessions, selectSession, navigate } = useApp();
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const completed = sessions.filter((s) => s.status === 'completed');
  const cancelled = sessions.filter((s) => s.status === 'cancelled');

  const current = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : cancelled;

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', count: upcoming.length, icon: CalendarClock },
    { id: 'completed' as const, label: 'Completed', count: completed.length, icon: CheckCircle2 },
    { id: 'cancelled' as const, label: 'Cancelled', count: cancelled.length, icon: XCircle },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-secondary-900">My Bookings</h1>
        <p className="mt-1 text-sm text-secondary-500">Manage all your mentoring sessions in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-secondary-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-secondary-400 hover:text-secondary-600'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                tab === t.id ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {current.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={tab === 'upcoming' ? <Calendar className="h-7 w-7" /> : tab === 'completed' ? <History className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            title={tab === 'upcoming' ? 'No upcoming sessions' : tab === 'completed' ? 'No completed sessions yet' : 'No cancelled sessions'}
            description={tab === 'upcoming' ? 'Book a session with a senior mentor to get started.' : 'Your completed sessions will appear here.'}
            action={tab === 'upcoming' ? <button onClick={() => navigate('discover')} className="btn-primary"><Compass className="h-4 w-4" /> Discover seniors</button> : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {current.map((session) => {
            const senior = seniors.find((s) => s.id === session.seniorId);
            return (
              <div
                key={session.id}
                className="card group cursor-pointer p-5 transition-all duration-200 hover:shadow-md"
                onClick={() => selectSession(session.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Date block */}
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <span className="text-[10px] font-semibold uppercase">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold">{new Date(session.date).getDate()}</span>
                  </div>

                  <img src={session.seniorAvatar} alt={session.seniorName} className="h-10 w-10 rounded-lg" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-secondary-800">{session.topic}</p>
                    <p className="truncate text-xs text-secondary-400">
                      {session.seniorName} · {senior?.company}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.time} · {session.duration}min</span>
                      <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Video</span>
                    </div>
                  </div>

                  {/* Status */}
                  {session.status === 'upcoming' && (
                    <span className="hidden chip-primary sm:flex">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" /> Upcoming
                    </span>
                  )}
                  {session.status === 'completed' && (
                    <span className="hidden chip-success sm:flex">
                      <CheckCircle2 className="h-3 w-3" /> {session.hasFeedback ? 'Reviewed' : 'Needs feedback'}
                    </span>
                  )}
                  {session.status === 'cancelled' && (
                    <span className="hidden chip bg-error-50 text-error-600 border border-error-200 sm:flex">
                      <XCircle className="h-3 w-3" /> Cancelled
                    </span>
                  )}

                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-secondary-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
