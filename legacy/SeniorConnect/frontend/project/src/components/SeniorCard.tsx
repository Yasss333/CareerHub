import type { Senior } from '@/types';
import { useApp } from '@/store';
import { CredibilityBadge, AvailabilityTag, RatingStars } from './ui';
import { Star, MapPin, Bookmark } from 'lucide-react';

export function SeniorCard({ senior }: { senior: Senior }) {
  const { selectSenior, savedSeniorIds, toggleSaveSenior } = useApp();
  const isSaved = savedSeniorIds.includes(senior.id);

  return (
    <div
      className="card group cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      onClick={() => selectSenior(senior.id)}
    >
      <div className="flex items-start gap-4">
        <img
          src={senior.avatar}
          alt={senior.name}
          className="h-14 w-14 flex-shrink-0 rounded-2xl ring-2 ring-primary-100"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-secondary-800 group-hover:text-primary-700">
                {senior.name}
              </h3>
              <p className="truncate text-sm text-secondary-500">{senior.title}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveSenior(senior.id);
              }}
              className={`flex-shrink-0 rounded-lg p-1.5 transition-all ${
                isSaved
                  ? 'text-primary-600 hover:bg-primary-50'
                  : 'text-secondary-300 hover:bg-secondary-100 hover:text-secondary-500'
              }`}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-secondary-500">
        <span className="font-semibold text-secondary-700">{senior.company}</span>
        <span className="text-secondary-300">·</span>
        <span className="flex items-center gap-0.5">
          <MapPin className="h-3 w-3" /> {senior.location}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {senior.expertise.slice(0, 3).map((skill) => (
          <span key={skill} className="chip-secondary">
            {skill}
          </span>
        ))}
        {senior.expertise.length > 3 && (
          <span className="chip-secondary">+{senior.expertise.length - 3}</span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <RatingStars rating={senior.rating} size={14} />
            <span className="text-sm font-semibold text-secondary-700">{senior.rating}</span>
          </div>
          <span className="text-xs text-secondary-400">({senior.reviewCount})</span>
        </div>
        <CredibilityBadge score={senior.credibilityScore} size="sm" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <AvailabilityTag availability={senior.availability} />
        <span className="text-xs font-medium text-secondary-400">
          {senior.sessionCount} sessions
        </span>
      </div>
    </div>
  );
}

export function SeniorListItem({ senior }: { senior: Senior }) {
  const { selectSenior, savedSeniorIds, toggleSaveSenior } = useApp();
  const isSaved = savedSeniorIds.includes(senior.id);

  return (
    <div
      className="card group flex cursor-pointer items-center gap-4 p-4 transition-all duration-200 hover:shadow-md"
      onClick={() => selectSenior(senior.id)}
    >
      <img
        src={senior.avatar}
        alt={senior.name}
        className="h-12 w-12 flex-shrink-0 rounded-xl ring-2 ring-primary-100"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-secondary-800 group-hover:text-primary-700">
            {senior.name}
          </h3>
          <CredibilityBadge score={senior.credibilityScore} size="sm" />
        </div>
        <p className="truncate text-xs text-secondary-500">
          {senior.title} · {senior.company}
        </p>
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
        <span className="text-sm font-semibold text-secondary-700">{senior.rating}</span>
      </div>
      <AvailabilityTag availability={senior.availability} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSaveSenior(senior.id);
        }}
        className={`flex-shrink-0 rounded-lg p-1.5 transition-all ${
          isSaved
            ? 'text-primary-600 hover:bg-primary-50'
            : 'text-secondary-300 hover:bg-secondary-100 hover:text-secondary-500'
        }`}
      >
        <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
