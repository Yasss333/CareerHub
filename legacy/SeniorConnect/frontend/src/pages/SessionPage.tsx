import { useState } from 'react';
import { useApp } from '@/store';
import { EmptyState, RatingStars } from '@/components/ui';
import { Calendar, Clock, Video, Check, X, Play } from 'lucide-react';
import { sessionsApi } from '@/api';

export function SessionPage() {
  const { sessions, selectedSessionId, navigate, currentUser, addSession } = useApp();
  
  const session = selectedSessionId ? sessions.find(s => s.id === selectedSessionId) : null;
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStatusUpdate = async (newStatus: string) => {
    setActionLoading(true);
    setError('');
    try {
      const updated = await sessionsApi.updateStatus(session!.id, newStatus);
      // Update session in store
      addSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    } finally {
      setActionLoading(false);
    }
  };

  if (!selectedSessionId || !session) {
    return <EmptyState icon={<Video />} title="No session selected" description="" />;
  }

  const isMentor = currentUser?.role === 'senior';
  const isJunior = currentUser?.role === 'junior';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-50 text-warning-700';
      case 'accepted': return 'bg-success-50 text-success-700';
      case 'rejected': return 'bg-error-50 text-error-700';
      case 'completed': return 'bg-success-50 text-success-700';
      case 'cancelled': return 'bg-error-50 text-error-700';
      case 'started': return 'bg-primary-50 text-primary-700';
      default: return 'bg-secondary-50 text-secondary-700';
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('bookings')} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
        ← Back to sessions
      </button>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-3xl font-bold text-secondary-900">{session.topic}</h1>
                <p className="mt-2 text-secondary-600">with {session.seniorName}</p>
              </div>
              <span className={`text-sm font-semibold px-4 py-2 rounded-full ${getStatusColor(session.status)}`}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <Calendar className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-xs text-secondary-500">Date</p>
                  <p className="font-semibold text-secondary-900">{session.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <Clock className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-xs text-secondary-500">Time</p>
                  <p className="font-semibold text-secondary-900">{session.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <Clock className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-xs text-secondary-500">Duration</p>
                  <p className="font-semibold text-secondary-900">{session.duration} min</p>
                </div>
              </div>
            </div>

            {session.notes && (
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-xs text-secondary-500 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-secondary-600">{session.notes}</p>
              </div>
            )}
          </div>

          {/* Status-specific actions */}
          {session.status === 'pending' && isMentor && (
            <div className="bg-blue-50 border border-primary-200 rounded-2xl p-6">
              <p className="text-primary-700 font-semibold mb-4">Session Request - Awaiting Your Response</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={actionLoading}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> Accept Session
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={actionLoading}
                  className="btn-error flex-1 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" /> Decline
                </button>
              </div>
            </div>
          )}

          {session.status === 'pending' && isJunior && (
            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-6">
              <p className="text-warning-700 font-semibold mb-2">Session Pending Approval</p>
              <p className="text-warning-600 text-sm">Your session request is waiting for mentor approval. You will be notified when it's accepted.</p>
            </div>
          )}

          {session.status === 'accepted' && isMentor && (
            <div className="bg-green-50 border border-success-200 rounded-2xl p-6">
              <p className="text-success-700 font-semibold mb-4">Session Accepted - Ready to Start</p>
              <button
                onClick={() => handleStatusUpdate('started')}
                disabled={actionLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" /> Start Meeting
              </button>
            </div>
          )}

          {session.status === 'accepted' && isJunior && (
            <div className="bg-blue-50 border border-primary-200 rounded-2xl p-6">
              <p className="text-primary-700 font-semibold mb-2">Session Accepted</p>
              <p className="text-primary-600 text-sm">The mentor has accepted your session. Wait for them to start the meeting.</p>
            </div>
          )}

          {session.status === 'started' && session.meetingLink && (
            <div className="bg-green-50 border border-success-200 rounded-2xl p-6">
              <p className="text-success-700 font-semibold mb-3">Meeting Started</p>
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Video className="h-4 w-4" /> Join Video Call
              </a>
            </div>
          )}

          {session.status === 'rejected' && (
            <div className="bg-error-50 border border-error-200 rounded-2xl p-6">
              <p className="text-error-700 font-semibold">Session Declined</p>
              <p className="text-error-600 text-sm mt-2">The mentor was unable to accept this session request. Please try booking with another mentor or time slot.</p>
            </div>
          )}

          {session.status === 'completed' && !session.hasFeedback && isJunior && (
            <div className="bg-blue-50 border border-primary-200 rounded-2xl p-6">
              <p className="text-primary-700 font-semibold mb-3">Share Your Feedback</p>
              <button
                onClick={() => navigate('feedback')}
                className="btn-primary w-full"
              >
                Submit Feedback
              </button>
            </div>
          )}

          {session.status === 'completed' && session.hasFeedback && session.feedback && (
            <div className="bg-white rounded-2xl p-8 shadow-card border-l-4 border-success-500">
              <h3 className="font-semibold text-secondary-900 mb-4">Your Feedback</h3>
              <RatingStars rating={session.feedback.rating} />
              <p className="mt-3 text-secondary-600">{session.feedback.comment}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card h-fit space-y-4">
          <img src={session.seniorAvatar} alt="" className="w-full h-32 object-cover rounded-lg" />
          <div>
            <p className="font-semibold text-secondary-900">{session.seniorName}</p>
            <p className="text-sm text-secondary-500 mt-1">Session Mentor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
