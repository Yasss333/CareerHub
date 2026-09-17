import { Shield, ShieldCheck, Star, Award, Zap, TrendingUp } from 'lucide-react';

// ── Credibility Badge ─────────────────────────────────────────
export function CredibilityBadge({ score, size = 'md' }: { score: number; size?: 'xs' | 'sm' | 'md' }) {
  const tier =
    score >= 95 ? { label: 'Elite',    color: 'text-amber-600 bg-amber-50',   icon: Award } :
    score >= 85 ? { label: 'Expert',   color: 'text-primary-700 bg-primary-50', icon: ShieldCheck } :
    score >= 70 ? { label: 'Trusted',  color: 'text-success-700 bg-success-50', icon: Shield } :
                  { label: 'Member',   color: 'text-secondary-600 bg-secondary-100', icon: Shield };

  const Icon = tier.icon;
  const sizes = { xs: 'text-[9px] px-1.5 py-0.5 gap-0.5', sm: 'text-[10px] px-2 py-0.5 gap-1', md: 'text-xs px-2.5 py-1 gap-1' };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${tier.color} ${sizes[size]}`}>
      <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {tier.label}
    </span>
  );
}

// ── Credibility Ring ──────────────────────────────────────────
export function CredibilityRing({
  score, size = 100, strokeWidth = 8, showLabel = true,
}: { score: number; size?: number; strokeWidth?: number; showLabel?: boolean }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? '#0d9488' : score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#94a3b8';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-secondary-800">{score}</span>
          <span className="text-xs text-secondary-400">/ 100</span>
        </div>
      )}
    </div>
  );
}

// ── Rating Stars ──────────────────────────────────────────────
export function RatingStars({
  rating, size = 16, interactive = false, onChange,
}: { rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={`${s <= rating ? 'fill-accent-400 text-accent-400' : 'fill-secondary-200 text-secondary-200'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onChange?.(s)}
        />
      ))}
    </div>
  );
}

// ── Availability Tag ──────────────────────────────────────────
export function AvailabilityTag({ availability }: { availability: 'available' | 'limited' | 'booked' }) {
  const cfg = {
    available: { label: 'Available',    cls: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
    limited:   { label: 'Limited slots', cls: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
    booked:    { label: 'Fully booked',  cls: 'bg-error-50 text-error-600',   dot: 'bg-error-500' },
  }[availability];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${availability === 'available' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action,
}: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-secondary-700">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-secondary-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
