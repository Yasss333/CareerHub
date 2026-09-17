import { useApp } from '@/store';
import type { Senior } from '@/types';
import { CredibilityBadge, AvailabilityTag, RatingStars } from './ui';
import { MapPin, Bookmark } from 'lucide-react';

export function SeniorCard({ senior }: { senior: Senior }) {
  const { selectSenior, toggleSaveSenior, savedSeniorIds } = useApp();
  const isSaved = savedSeniorIds.includes(senior.id);

  return (
    <div
      className="card group cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => selectSenior(senior.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={senior.avatar} alt={senior.name} className="h-12 w-12 rounded-xl ring-2 ring-primary-100" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-secondary-800">{senior.name}</p>
              <CredibilityBadge score={senior.credibilityScore} size="xs" />
            </div>
            <p className="truncate text-xs text-secondary-400">{senior.title}</p>
            <p className="truncate text-xs font-medium text-primary-600">{senior.company}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSaveSenior(senior.id); }}
          className={`rounded-lg p-1.5 transition-colors ${isSaved ? 'text-primary-600' : 'text-secondary-300 hover:text-secondary-500'}`}
        >
          <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {senior.expertise.slice(0, 3).map(skill => (
          <span key={skill} className="chip-primary text-[10px]">{skill}</span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-secondary-400">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{senior.location}</span>
        <RatingStars rating={senior.rating} size={11} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-secondary-100 pt-3">
        <AvailabilityTag availability={senior.availability} />
        <span className="text-xs text-secondary-400">{senior.sessionCount} sessions</span>
      </div>
    </div>
  );
}
