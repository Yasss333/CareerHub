import { useState } from 'react';
import { useApp } from '@/store';
import { seniors, reviews } from '@/mockData';
import { CredibilityRing, CredibilityBadge, AvailabilityTag, RatingStars } from '@/components/ui';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  Bookmark,
  Award,
  Clock,
  CheckCircle2,
  MessageSquare,
  Video,
  ChevronRight,
} from 'lucide-react';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SeniorProfilePage() {
  const { selectedSeniorId, navigate, savedSeniorIds, toggleSaveSenior } = useApp();
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'slots'>('about');

  const senior = seniors.find((s) => s.id === selectedSeniorId);
  if (!senior) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-secondary-500">Senior not found.</p>
        <button onClick={() => navigate('discover')} className="btn-primary mt-4">Back to discover</button>
      </div>
    );
  }

  const isSaved = savedSeniorIds.includes(senior.id);
  const seniorReviews = reviews.filter((r) => r.seniorId === senior.id);
  const availableSlots = senior.slots.filter((s) => s.available);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back */}
      <button onClick={() => navigate('discover')} className="flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-secondary-800">
        <ArrowLeft className="h-4 w-4" /> Back to discover
      </button>

      {/* Header card */}
      <div className="card animate-fade-in-up overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-primary-500 to-primary-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <img
              src={senior.avatar}
              alt={senior.name}
              className="h-24 w-24 rounded-2xl ring-4 ring-white"
            />
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-secondary-900">{senior.name}</h1>
                <CredibilityBadge score={senior.credibilityScore} size="sm" />
              </div>
              <p className="text-sm text-secondary-500">{senior.title} · {senior.company}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-secondary-400">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {senior.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {senior.experience} yrs experience</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {senior.sessionCount} sessions</span>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => toggleSaveSenior(senior.id)}
                className={`btn-secondary ${isSaved ? 'border-primary-300 bg-primary-50 text-primary-700' : ''}`}
              >
                <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => navigate('booking')} className="btn-primary" disabled={senior.availability === 'booked'}>
                <Calendar className="h-4 w-4" />
                Book session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card flex flex-col items-center p-4">
          <CredibilityRing score={senior.credibilityScore} size={80} strokeWidth={6} showLabel={false} />
          <p className="mt-1.5 text-xl font-bold text-secondary-800">{senior.credibilityScore}</p>
          <p className="text-xs text-secondary-400">Credibility</p>
        </div>
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex h-[80px] items-center justify-center">
            <Star className="h-8 w-8 fill-accent-400 text-accent-400" />
          </div>
          <p className="text-xl font-bold text-secondary-800">{senior.rating}</p>
          <p className="text-xs text-secondary-400">{senior.reviewCount} reviews</p>
        </div>
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex h-[80px] items-center justify-center">
            <Calendar className="h-8 w-8 text-primary-500" />
          </div>
          <p className="text-xl font-bold text-secondary-800">{senior.sessionCount}</p>
          <p className="text-xs text-secondary-400">Sessions</p>
        </div>
        <div className="card flex flex-col items-center justify-center p-4">
          <div className="flex h-[80px] items-center justify-center">
            <Clock className="h-8 w-8 text-primary-500" />
          </div>
          <p className="text-xl font-bold text-secondary-800">{senior.experience}</p>
          <p className="text-xs text-secondary-400">Years exp.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-secondary-200">
        {[
          { id: 'about' as const, label: 'About', icon: Briefcase },
          { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
          { id: 'slots' as const, label: 'Available Slots', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-secondary-400 hover:text-secondary-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'reviews' && ` (${seniorReviews.length})`}
            {tab.id === 'slots' && ` (${availableSlots.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'about' && (
        <div className="animate-fade-in space-y-6">
          {/* Bio */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold text-secondary-700">About</h3>
            <p className="text-sm leading-relaxed text-secondary-600">{senior.bio}</p>
          </div>

          {/* Expertise */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold text-secondary-700">Areas of expertise</h3>
            <div className="flex flex-wrap gap-2">
              {senior.expertise.map((skill) => (
                <span key={skill} className="chip-primary">{skill}</span>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary-700">
              <Award className="h-4 w-4 text-primary-600" /> Achievements
            </h3>
            <div className="space-y-2.5">
              {senior.achievements.map((achievement) => (
                <div key={achievement} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
                  <span className="text-sm text-secondary-600">{achievement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Domain + availability */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <h3 className="mb-3 text-sm font-semibold text-secondary-700">Domain</h3>
              <p className="text-sm text-secondary-600">{senior.domain}</p>
            </div>
            <div className="card p-6">
              <h3 className="mb-3 text-sm font-semibold text-secondary-700">Current availability</h3>
              <AvailabilityTag availability={senior.availability} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="animate-fade-in space-y-4">
          {/* Rating summary */}
          <div className="card flex items-center gap-6 p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-secondary-800">{senior.rating}</p>
              <RatingStars rating={senior.rating} size={18} />
              <p className="mt-1 text-xs text-secondary-400">{senior.reviewCount} reviews</p>
            </div>
            <div className="h-16 w-px bg-secondary-200" />
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = star === 5 ? seniorReviews.filter((r) => r.rating === 5).length : star === 4 ? seniorReviews.filter((r) => r.rating === 4).length : 0;
                const pct = seniorReviews.length > 0 ? (count / seniorReviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-xs text-secondary-400">{star}</span>
                    <Star className="h-3 w-3 fill-accent-400 text-accent-400" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary-100">
                      <div className="h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-xs text-secondary-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          {seniorReviews.length === 0 ? (
            <div className="card p-8 text-center text-sm text-secondary-400">No reviews yet.</div>
          ) : (
            seniorReviews.map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <img src={review.juniorAvatar} alt={review.juniorName} className="h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-secondary-800">{review.juniorName}</p>
                      <span className="text-xs text-secondary-400">{formatDate(review.date)}</span>
                    </div>
                    <RatingStars rating={review.rating} size={14} />
                    <p className="mt-2 text-sm leading-relaxed text-secondary-600">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="animate-fade-in space-y-4">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-secondary-700">Available time slots</h3>
              <AvailabilityTag availability={senior.availability} />
            </div>

            {availableSlots.length === 0 ? (
              <p className="py-8 text-center text-sm text-secondary-400">No available slots right now. Check back soon.</p>
            ) : (
              <div className="space-y-4">
                {/* Group by date */}
                {Object.entries(
                  availableSlots.reduce((acc, slot) => {
                    (acc[slot.date] ??= []).push(slot);
                    return acc;
                  }, {} as Record<string, typeof availableSlots>)
                ).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                      {formatDate(date)}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => navigate('booking')}
                          className="group flex items-center justify-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-3 py-2.5 text-sm font-medium text-secondary-700 transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                        >
                          <Clock className="h-3.5 w-3.5 text-secondary-400 group-hover:text-primary-500" />
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="card flex items-center justify-between bg-gradient-to-br from-primary-50 to-primary-100 p-5">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-semibold text-secondary-800">Ready to book?</p>
                <p className="text-sm text-secondary-500">Pick a slot and set your topic.</p>
              </div>
            </div>
            <button onClick={() => navigate('booking')} className="btn-primary">
              Book now <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
