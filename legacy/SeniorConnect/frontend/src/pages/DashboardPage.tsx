import { useApp } from '@/store';
import { useEffect, useState } from 'react';
import { seniorsApi } from '@/api';
import type { ApiSenior } from '@/api';
import { CredibilityRing, EmptyState } from '@/components/ui';
import { Calendar, Star, Users } from 'lucide-react';

export function DashboardPage() {
  const { currentUser, navigate } = useApp();
  const [topSeniors, setTopSeniors] = useState<ApiSenior[]>([]);

  useEffect(() => {
    seniorsApi.list({ credibility: '80' }).then(setTopSeniors).catch(console.error);
  }, []);

  if (!currentUser) return <EmptyState icon={<Users />} title="Loading" description="..." />;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-secondary-900">Welcome back, {currentUser.name}!</h2>
              <p className="mt-2 text-secondary-500">Let's continue your journey to excellence</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 shadow-card flex flex-col items-center justify-center">
          <CredibilityRing score={currentUser.credibilityScore} size={120} />
          <p className="mt-4 text-sm text-secondary-600">Credibility Score</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-card">
        <h3 className="font-display text-xl font-bold text-secondary-900 mb-6">Featured Mentors</h3>
        {topSeniors.length === 0 ? (
          <EmptyState icon={<Users />} title="No mentors found" description="Check back soon" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topSeniors.slice(0, 3).map((senior) => (
              <button
                key={senior.id}
                onClick={() => { navigate('senior-profile'); /* would set selectedSeniorId */ }}
                className="flex flex-col gap-4 p-4 border border-secondary-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all"
              >
                <img src={senior.avatar} alt="" className="h-16 w-16 rounded-full" />
                <div className="text-left">
                  <p className="font-semibold text-secondary-900">{senior.name}</p>
                  <p className="text-sm text-secondary-500">{senior.title} at {senior.company}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 text-accent-400 fill-accent-400" />
                    <span className="text-sm font-semibold text-secondary-900">{senior.rating}</span>
                    <span className="text-xs text-secondary-500">({senior.reviewCount})</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
