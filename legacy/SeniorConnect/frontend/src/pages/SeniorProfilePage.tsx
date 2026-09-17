import { useApp } from '@/store';
import { useEffect, useState } from 'react';
import { seniorsApi } from '@/api';
import type { ApiSenior } from '@/api';
import { CredibilityBadge, CredibilityRing, AvailabilityTag, RatingStars, EmptyState } from '@/components/ui';
import { MapPin, Briefcase, Award, ChevronRight } from 'lucide-react';

export function SeniorProfilePage() {
  const { selectedSeniorId, navigate } = useApp();
  const [senior, setSenior] = useState<ApiSenior | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSeniorId) return;
    setLoading(true);
    seniorsApi.get(selectedSeniorId).then(setSenior).finally(() => setLoading(false));
  }, [selectedSeniorId]);

  if (!selectedSeniorId) return <EmptyState icon={<Briefcase />} title="No mentor selected" description="" />;
  if (loading) return <EmptyState icon={<Briefcase />} title="Loading" description="" />;
  if (!senior) return <EmptyState icon={<Briefcase />} title="Mentor not found" description="" />;

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('discover')} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
        ← Back to discover
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-card">
            <div className="flex items-start gap-6">
              <img src={senior.avatar} alt={senior.name} className="h-24 w-24 rounded-full" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-3xl font-bold text-secondary-900">{senior.name}</h1>
                    <p className="mt-1 text-lg text-secondary-600">{senior.title}</p>
                    <p className="text-secondary-500 flex items-center gap-1 mt-2">
                      <MapPin className="h-4 w-4" /> {senior.location}
                    </p>
                  </div>
                  <CredibilityBadge score={senior.credibilityScore} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <AvailabilityTag availability={senior.availability} />
              <div className="flex items-center gap-2">
                <RatingStars rating={Math.round(senior.rating)} size={16} />
                <span className="text-sm text-secondary-600">{senior.rating}/5 ({senior.reviewCount} reviews)</span>
              </div>
              <div className="text-sm text-secondary-600">{senior.sessionCount} sessions completed</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-card">
            <h2 className="font-display text-xl font-bold text-secondary-900 mb-4">About</h2>
            <p className="text-secondary-600 leading-relaxed">{senior.bio}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-card">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary-600" /> Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {senior.expertise.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-card">
              <h3 className="font-semibold text-secondary-900 mb-4">Company Info</h3>
              <p className="text-secondary-600"><strong>{senior.company}</strong></p>
              <p className="text-secondary-500 text-sm mt-2">{senior.experience} years experience</p>
              <p className="text-secondary-500 text-sm">Domain: {senior.domain}</p>
            </div>
          </div>

          {senior.achievements && senior.achievements.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-card">
              <h3 className="font-semibold text-secondary-900 mb-4">Achievements</h3>
              <ul className="space-y-2">
                {senior.achievements.map((achievement) => (
                  <li key={achievement} className="text-secondary-600 flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {senior.reviews && senior.reviews.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-card">
              <h3 className="font-semibold text-secondary-900 mb-6">Recent Reviews</h3>
              <div className="space-y-4">
                {senior.reviews.map((review) => (
                  <div key={review.id} className="pb-4 border-b border-secondary-200 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={review.juniorAvatar} alt="" className="h-10 w-10 rounded-full" />
                        <div>
                          <p className="font-semibold text-secondary-900">{review.juniorName}</p>
                          <RatingStars rating={review.rating} size={14} />
                        </div>
                      </div>
                      <p className="text-xs text-secondary-400">{review.date}</p>
                    </div>
                    <p className="mt-2 text-secondary-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 shadow-card h-fit space-y-6">
          <CredibilityRing score={senior.credibilityScore} size={120} />
          
          <button
            onClick={() => navigate('booking')}
            className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Book a Session
          </button>

          <div className="space-y-4 pt-6 border-t border-primary-200">
            <div>
              <p className="text-xs text-secondary-600 uppercase tracking-wide mb-1">Available Slots</p>
              <p className="text-lg font-bold text-secondary-900">
                {senior.slots.filter(s => s.available).length}/{senior.slots.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
