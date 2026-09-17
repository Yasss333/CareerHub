import { useApp } from '@/store';
import { AvailabilityTag, EmptyState } from '@/components/ui';
import { Calendar, Clock, FileText } from 'lucide-react';

export function BookingsPage() {
  const { sessions, navigate, selectSession } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">My Sessions</h1>
        <p className="mt-2 text-secondary-500">View and manage your mentorship sessions</p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No sessions yet"
          description="Book your first session with a mentor"
          action={
            <button onClick={() => navigate('discover')} className="btn-primary">
              Browse Mentors
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                selectSession(session.id);
                navigate('session');
              }}
              className="w-full text-left bg-white rounded-xl border border-secondary-200 hover:border-primary-400 hover:bg-primary-50 transition-all p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={session.seniorAvatar} alt="" className="h-12 w-12 rounded-full" />
                    <div>
                      <p className="font-semibold text-secondary-900">{session.seniorName}</p>
                      <p className="text-sm text-secondary-500">{session.topic}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-secondary-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {session.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" /> {session.duration} min
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    session.status === 'completed' ? 'bg-success-50 text-success-700' :
                    session.status === 'cancelled' ? 'bg-error-50 text-error-700' :
                    'bg-primary-50 text-primary-700'
                  }`}>
                    {session.status}
                  </span>
                  {session.hasFeedback && (
                    <span className="text-xs text-secondary-500">Feedback given</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
