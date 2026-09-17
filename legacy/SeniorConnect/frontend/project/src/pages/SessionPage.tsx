import { useApp } from '@/store';
import { seniors } from '@/mockData';
import { CredibilityBadge, RatingStars, EmptyState } from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Bookmark,
  ExternalLink,
  Video as VideoIcon,
} from 'lucide-react';

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function SessionPage() {
  const { selectedSessionId, sessions, navigate, cancelSession, markSessionFeedback } = useApp();

  const session = sessions.find((s) => s.id === selectedSessionId);

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="card">
          <EmptyState
            icon={<Calendar className="h-7 w-7" />}
            title="No session selected"
            description="Pick a session from your bookings or dashboard."
            action={<button onClick={() => navigate('bookings')} className="btn-primary">View bookings</button>}
          />
        </div>
      </div>
    );
  }

  const senior = seniors.find((s) => s.id === session.seniorId);
  const isUpcoming = session.status === 'upcoming';
  const isCompleted = session.status === 'completed';
  const isCancelled = session.status === 'cancelled';

  const statusConfig = {
    upcoming: { label: 'Upcoming', cls: 'bg-primary-50 text-primary-700 border-primary-200', icon: Calendar },
    completed: { label: 'Completed', cls: 'bg-success-50 text-success-700 border-success-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', cls: 'bg-error-50 text-error-700 border-error-200', icon: XCircle },
  };
  const status = statusConfig[session.status];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate('bookings')} className="flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-secondary-800">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </button>

      {/* Status banner */}
      <div className={`flex items-center gap-2.5 rounded-xl border p-4 ${status.cls}`}>
        <status.icon className="h-5 w-5" />
        <span className="text-sm font-semibold">{status.label}</span>
        <span className="text-sm opacity-70">· {formatDateFull(session.date)} at {session.time}</span>
      </div>

      {/* Session detail card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <img src={session.seniorAvatar} alt={session.seniorName} className="h-14 w-14 rounded-2xl ring-2 ring-primary-100" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-secondary-800">{session.seniorName}</h2>
              {senior && <CredibilityBadge score={senior.credibilityScore} size="sm" />}
            </div>
            <p className="text-sm text-secondary-500">{senior?.title} · {senior?.company}</p>
            {senior && (
              <div className="mt-1.5 flex items-center gap-3 text-xs text-secondary-400">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {senior.location}</span>
                <span className="flex items-center gap-1"><RatingStars rating={senior.rating} size={12} /> {senior.rating}</span>
              </div>
            )}
          </div>
          {senior && (
            <button
              onClick={() => navigate('senior-profile')}
              className="btn-ghost hidden text-sm sm:flex"
            >
              View profile
            </button>
          )}
        </div>

        {/* Topic */}
        <div className="mt-5 rounded-xl bg-secondary-50 p-4">
          <p className="mb-1 text-xs font-medium text-secondary-400">Session topic</p>
          <p className="text-sm font-semibold text-secondary-800">{session.topic}</p>
          {session.notes && (
            <div className="mt-3 border-t border-secondary-200 pt-3">
              <p className="mb-1 text-xs font-medium text-secondary-400">Notes</p>
              <p className="text-sm text-secondary-600">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-secondary-100 p-3 text-center">
            <Calendar className="mb-1 h-5 w-5 text-primary-500" />
            <p className="text-xs text-secondary-400">Date</p>
            <p className="text-sm font-semibold text-secondary-700">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-secondary-100 p-3 text-center">
            <Clock className="mb-1 h-5 w-5 text-primary-500" />
            <p className="text-xs text-secondary-400">Time</p>
            <p className="text-sm font-semibold text-secondary-700">{session.time}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-secondary-100 p-3 text-center">
            <Video className="mb-1 h-5 w-5 text-primary-500" />
            <p className="text-xs text-secondary-400">Duration</p>
            <p className="text-sm font-semibold text-secondary-700">{session.duration} min</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-secondary-100 p-3 text-center">
            <VideoIcon className="mb-1 h-5 w-5 text-primary-500" />
            <p className="text-xs text-secondary-400">Format</p>
            <p className="text-sm font-semibold text-secondary-700">1-on-1</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-secondary-100 pt-5">
          {isUpcoming && (
            <>
              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <Video className="h-4 w-4" /> Join session
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => { cancelSession(session.id); navigate('bookings'); }}
                className="btn-secondary text-error-600 hover:bg-error-50 hover:text-error-700"
              >
                <XCircle className="h-4 w-4" /> Cancel session
              </button>
            </>
          )}
          {isCompleted && !session.hasFeedback && (
            <button
              onClick={() => {
                markSessionFeedback(session.id);
                navigate('feedback');
              }}
              className="btn-primary"
            >
              <MessageSquare className="h-4 w-4" /> Leave feedback
            </button>
          )}
          {isCompleted && session.hasFeedback && (
            <span className="chip-success">
              <CheckCircle2 className="h-4 w-4" /> Feedback submitted
            </span>
          )}
          {senior && (
            <button
              onClick={() => navigate('senior-profile')}
              className="btn-ghost"
            >
              <Bookmark className="h-4 w-4" /> View mentor
            </button>
          )}
        </div>
      </div>

      {/* Meeting info */}
      {isUpcoming && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-secondary-700">Meeting details</h3>
          <div className="flex items-center justify-between rounded-xl bg-secondary-50 p-3">
            <div className="flex items-center gap-2.5">
              <Video className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-secondary-700">Video call link</p>
                <p className="text-xs text-secondary-400">{session.meetingLink}</p>
              </div>
            </div>
            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
