import { useCurrentUser } from '@/store';
import { CredibilityRing, EmptyState } from '@/components/ui';
import { User } from 'lucide-react';

export function ProfilePage() {
  const currentUser = useCurrentUser();

  if (!currentUser) return <EmptyState icon={<User />} title="Not authenticated" description="" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">My Profile</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-2xl p-8 shadow-card space-y-6">
          <div className="flex items-center gap-4">
            <img src={currentUser.avatar} alt="" className="h-20 w-20 rounded-full" />
            <div>
              <h2 className="font-semibold text-secondary-900 text-lg">{currentUser.name}</h2>
              <p className="text-secondary-500">{currentUser.email}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-secondary-900 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(currentUser.interests || []).map((interest) => (
                <span key={interest} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {currentUser.goals && currentUser.goals.length > 0 && (
            <div>
              <h3 className="font-semibold text-secondary-900 mb-3">Goals</h3>
              <div className="space-y-3">
                {currentUser.goals.map((goal) => (
                  <div key={goal.title}>
                    <p className="text-sm font-medium text-secondary-900">{goal.title}</p>
                    <div className="mt-1 h-2 w-full bg-secondary-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600" style={{ width: `${goal.progress}%` }} />
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">{goal.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 shadow-card flex flex-col items-center justify-center h-fit">
          <CredibilityRing score={currentUser.credibilityScore} size={120} />
          <p className="mt-4 text-sm font-semibold text-secondary-700">Credibility Score</p>
          {currentUser.badges.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-secondary-500 uppercase tracking-wide mb-2">Badges</p>
              {currentUser.badges.map((badge) => (
                <p key={badge} className="text-sm font-semibold text-primary-700">{badge}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
