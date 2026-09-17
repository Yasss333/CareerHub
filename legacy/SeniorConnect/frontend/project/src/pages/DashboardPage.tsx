import { useApp, juniorProfile } from '@/store';
import { seniors } from '@/mockData';
import { CredibilityRing, CredibilityBadge, ProgressBar, EmptyState, RatingStars } from '@/components/ui';
import { SeniorCard } from '@/components/SeniorCard';
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  Bookmark,
  TrendingUp,
  Award,
  Target,
  CheckCircle2,
  Compass,
  History,
} from 'lucide-react';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export function DashboardPage() {
  const { sessions, savedSeniorIds, selectSenior, selectSession, navigate } = useApp();

  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const completed = sessions.filter((s) => s.status === 'completed');
  const savedSeniors = seniors.filter((s) => savedSeniorIds.includes(s.id));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-secondary-900">
          Welcome back, Rohan
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          Here's what's happening with your mentorship journey.
        </p>
      </div>

      {/* Top row: profile summary + credibility */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile summary */}
        <div className="card animate-fade-in-up p-6 lg:col-span-2">
          <div className="flex items-center gap-4">
            <img
              src={juniorProfile.avatar}
              alt={juniorProfile.name}
              className="h-16 w-16 rounded-2xl ring-2 ring-primary-100"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-secondary-800">{juniorProfile.name}</h2>
                <CredibilityBadge score={juniorProfile.credibilityScore} size="sm" />
              </div>
              <p className="text-sm text-secondary-500">{juniorProfile.title}</p>
              <p className="mt-0.5 text-xs text-secondary-400">
                {juniorProfile.university} · {juniorProfile.year}
              </p>
            </div>
            <button onClick={() => navigate('profile')} className="btn-secondary hidden sm:flex">
              View profile
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary-50 p-4 text-center">
              <p className="text-2xl font-bold text-secondary-800">{juniorProfile.sessionsCompleted}</p>
              <p className="text-xs text-secondary-400">Sessions done</p>
            </div>
            <div className="rounded-xl bg-secondary-50 p-4 text-center">
              <p className="text-2xl font-bold text-secondary-800">{juniorProfile.seniorsSaved}</p>
              <p className="text-xs text-secondary-400">Seniors saved</p>
            </div>
            <div className="rounded-xl bg-secondary-50 p-4 text-center">
              <p className="text-2xl font-bold text-secondary-800">{upcoming.length}</p>
              <p className="text-xs text-secondary-400">Upcoming</p>
            </div>
          </div>

          {/* Interests */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-secondary-400">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {juniorProfile.interests.map((interest) => (
                <span key={interest} className="chip-primary">{interest}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Credibility ring */}
        <div className="card animate-fade-in-up flex flex-col items-center justify-center p-6" style={{ animationDelay: '0.05s' }}>
          <div className="mb-3 flex items-center gap-2 self-start">
            <Award className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-secondary-700">Your credibility</h3>
          </div>
          <CredibilityRing score={juniorProfile.credibilityScore} size={130} />
          <p className="mt-3 text-center text-xs text-secondary-400">
            Complete sessions and leave feedback to grow your score.
          </p>
          <div className="mt-4 w-full rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-xs font-medium text-primary-700">
              +28 points since you joined
            </p>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="card animate-fade-in-up p-6">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-secondary-700">Your goals</h3>
        </div>
        <div className="space-y-4">
          {juniorProfile.goals.map((goal) => (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">{goal.title}</span>
                <span className="text-xs font-semibold text-primary-600">{goal.progress}%</span>
              </div>
              <ProgressBar value={goal.progress} />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary-500" />
            <h2 className="font-display text-lg font-semibold text-secondary-800">Upcoming sessions</h2>
          </div>
          <button onClick={() => navigate('bookings')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Calendar className="h-7 w-7" />}
              title="No upcoming sessions"
              description="Browse our senior mentors and book your next session."
              action={<button onClick={() => navigate('discover')} className="btn-primary">Discover seniors</button>}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((session) => {
              const senior = seniors.find((s) => s.id === session.seniorId);
              return (
                <div
                  key={session.id}
                  className="card group cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => selectSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`chip ${isToday(session.date) ? 'chip-success' : 'chip-secondary'}`}>
                      {isToday(session.date) ? 'Today' : formatDate(session.date)} · {session.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-secondary-400">
                      <Clock className="h-3 w-3" /> {session.duration} min
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <img src={session.seniorAvatar} alt={session.seniorName} className="h-10 w-10 rounded-xl ring-1 ring-secondary-200" />
                    <div>
                      <p className="text-sm font-semibold text-secondary-800">{session.seniorName}</p>
                      <p className="text-xs text-secondary-400">{senior?.title} · {senior?.company}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-secondary-600">{session.topic}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-secondary-400">
                      <Video className="h-3.5 w-3.5" /> Video session
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:text-primary-700">
                      Details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved seniors */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-secondary-500" />
            <h2 className="font-display text-lg font-semibold text-secondary-800">Saved seniors</h2>
          </div>
          <button onClick={() => navigate('discover')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Discover more
          </button>
        </div>

        {savedSeniors.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Bookmark className="h-7 w-7" />}
              title="No saved seniors yet"
              description="Bookmark mentors you're interested in to find them quickly later."
              action={<button onClick={() => navigate('discover')} className="btn-primary">Browse seniors</button>}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {savedSeniors.map((senior) => (
              <SeniorCard key={senior.id} senior={senior} />
            ))}
          </div>
        )}
      </div>

      {/* Session history */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-secondary-500" />
          <h2 className="font-display text-lg font-semibold text-secondary-800">Session history</h2>
        </div>
        <div className="card divide-y divide-secondary-100">
          {completed.map((session) => {
            const senior = seniors.find((s) => s.id === session.seniorId);
            return (
              <div
                key={session.id}
                className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-secondary-50"
                onClick={() => selectSession(session.id)}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <img src={session.seniorAvatar} alt={session.seniorName} className="h-9 w-9 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-secondary-800">{session.topic}</p>
                  <p className="truncate text-xs text-secondary-400">
                    {session.seniorName} · {senior?.company} · {formatDate(session.date)}
                  </p>
                </div>
                {session.hasFeedback ? (
                  <span className="hidden chip-success sm:flex">
                    <CheckCircle2 className="h-3 w-3" /> Reviewed
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectSession(session.id);
                    }}
                    className="chip-accent"
                  >
                    Leave feedback
                  </button>
                )}
                <RatingStars rating={senior?.rating ?? 0} size={12} />
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="card flex flex-col items-center justify-between gap-4 bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Ready for your next session?</p>
            <p className="text-sm text-primary-100">Find a mentor who matches your current goals.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('discover')}
          className="btn bg-white text-primary-700 hover:bg-primary-50"
        >
          <Compass className="h-4 w-4" />
          Discover seniors
        </button>
      </div>
    </div>
  );
}
