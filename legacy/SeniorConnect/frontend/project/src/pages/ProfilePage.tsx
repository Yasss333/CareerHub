import { useApp, juniorProfile } from '@/store';
import { seniors } from '@/mockData';
import { CredibilityRing, CredibilityBadge, ProgressBar } from '@/components/ui';
import { SeniorCard } from '@/components/SeniorCard';
import {
  Mail,
  GraduationCap,
  Award,
  Target,
  Bookmark,
  Calendar,
  TrendingUp,
  Edit3,
  CheckCircle2,
} from 'lucide-react';

export function ProfilePage() {
  const { savedSeniorIds, sessions, navigate } = useApp();

  const savedSeniors = seniors.filter((s) => savedSeniorIds.includes(s.id));
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const upcomingSessions = sessions.filter((s) => s.status === 'upcoming');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header card */}
      <div className="card animate-fade-in-up overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <img
              src={juniorProfile.avatar}
              alt={juniorProfile.name}
              className="h-24 w-24 rounded-2xl ring-4 ring-white"
            />
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-secondary-900">{juniorProfile.name}</h1>
                <CredibilityBadge score={juniorProfile.credibilityScore} size="sm" />
              </div>
              <p className="text-sm text-secondary-500">{juniorProfile.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-secondary-400">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {juniorProfile.email}</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {juniorProfile.university}</span>
              </div>
            </div>
            <button className="btn-secondary mb-1">
              <Edit3 className="h-4 w-4" /> Edit profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4 text-center">
          <Calendar className="mx-auto mb-1.5 h-5 w-5 text-primary-500" />
          <p className="text-2xl font-bold text-secondary-800">{completedSessions.length}</p>
          <p className="text-xs text-secondary-400">Completed</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="mx-auto mb-1.5 h-5 w-5 text-primary-500" />
          <p className="text-2xl font-bold text-secondary-800">{upcomingSessions.length}</p>
          <p className="text-xs text-secondary-400">Upcoming</p>
        </div>
        <div className="card p-4 text-center">
          <Bookmark className="mx-auto mb-1.5 h-5 w-5 text-primary-500" />
          <p className="text-2xl font-bold text-secondary-800">{savedSeniors.length}</p>
          <p className="text-xs text-secondary-400">Saved</p>
        </div>
        <div className="card p-4 text-center">
          <Award className="mx-auto mb-1.5 h-5 w-5 text-primary-500" />
          <p className="text-2xl font-bold text-secondary-800">{juniorProfile.credibilityScore}</p>
          <p className="text-xs text-secondary-400">Credibility</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: credibility + interests */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center p-6">
            <h3 className="mb-4 flex items-center gap-2 self-start text-sm font-semibold text-secondary-700">
              <Award className="h-4 w-4 text-primary-600" /> Credibility score
            </h3>
            <CredibilityRing score={juniorProfile.credibilityScore} size={140} />
            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-400">Sessions completed</span>
                <span className="font-semibold text-secondary-700">{completedSessions.length}/10</span>
              </div>
              <ProgressBar value={completedSessions.length * 10} />
            </div>
            <div className="mt-3 w-full rounded-lg bg-success-50 p-2.5 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-success-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified student
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold text-secondary-700">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {juniorProfile.interests.map((interest) => (
                <span key={interest} className="chip-primary">{interest}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: goals + saved seniors */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-secondary-700">
              <Target className="h-4 w-4 text-primary-600" /> Career goals
            </h3>
            <div className="space-y-5">
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

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-700">
                <Bookmark className="h-4 w-4 text-primary-600" /> Saved seniors
              </h3>
              <button onClick={() => navigate('discover')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Browse more
              </button>
            </div>
            {savedSeniors.length === 0 ? (
              <div className="card p-8 text-center text-sm text-secondary-400">
                No saved seniors yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedSeniors.map((senior) => (
                  <SeniorCard key={senior.id} senior={senior} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
