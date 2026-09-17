import type { ReactNode } from 'react';

interface CredibilityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function CredibilityRing({
  score,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
}: CredibilityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 90 ? '#0d9488' : score >= 75 ? '#14b8a6' : score >= 60 ? '#f59e0b' : '#94a3b8';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-secondary-800" style={{ fontSize: size * 0.22 }}>
            {score}
          </span>
          <span className="text-secondary-400" style={{ fontSize: size * 0.1 }}>
            / 100
          </span>
        </div>
      )}
    </div>
  );
}

interface CredibilityBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function CredibilityBadge({ score, size = 'md' }: CredibilityBadgeProps) {
  const tier =
    score >= 95
      ? { label: 'Elite', cls: 'bg-primary-50 text-primary-700 border-primary-300' }
      : score >= 85
      ? { label: 'Trusted', cls: 'bg-success-50 text-success-700 border-success-300' }
      : score >= 70
      ? { label: 'Verified', cls: 'bg-accent-50 text-accent-700 border-accent-300' }
      : { label: 'Building', cls: 'bg-secondary-100 text-secondary-600 border-secondary-300' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        tier.cls
      } ${size === 'sm' ? 'text-[10px] px-2' : ''}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {tier.label}
    </span>
  );
}

interface AvailabilityTagProps {
  availability: 'available' | 'limited' | 'booked';
}

export function AvailabilityTag({ availability }: AvailabilityTagProps) {
  const map = {
    available: { label: 'Available', cls: 'bg-success-50 text-success-700 border-success-200' },
    limited: { label: 'Limited slots', cls: 'bg-accent-50 text-accent-700 border-accent-200' },
    booked: { label: 'Fully booked', cls: 'bg-error-50 text-error-700 border-error-200' },
  };
  const config = map[availability];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.cls}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
        availability === 'available' ? 'bg-success-500' : availability === 'limited' ? 'bg-accent-500' : 'bg-error-500'
      }`} />
      {config.label}
    </span>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-secondary-800">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

interface RatingStarsProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function RatingStars({ rating, size = 16, interactive = false, onChange }: RatingStarsProps) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= Math.round(rating) ? '#f59e0b' : 'none'}
            stroke={star <= Math.round(rating) ? '#f59e0b' : '#cbd5e1'}
            strokeWidth="2"
            strokeLinejoin="round"
          >
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-secondary-100 ${className}`}>
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-700 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-400">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-secondary-700">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-secondary-400">{description}</p>
      {action}
    </div>
  );
}
