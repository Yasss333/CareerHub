import { useState } from 'react';
import { Calendar, Clock, X, Save } from 'lucide-react';

interface Session {
  id: string;
  scheduledTime: string;
  duration: number;
  topic: string;
}

interface RescheduleModalProps {
  session: Session;
  onClose: () => void;
  onRescheduled: () => void;
}

const RescheduleModal = ({ session, onClose, onRescheduled }: RescheduleModalProps) => {
  const [scheduledTime, setScheduledTime] = useState(
    new Date(session.scheduledTime).toISOString().slice(0, 16)
  );
  const [duration, setDuration] = useState(session.duration);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connect/sessions/${session.id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduledTime: new Date(scheduledTime).toISOString(),
          duration
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to reschedule session');
      }

      onRescheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reschedule Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Reschedule: <span className="font-medium">{session.topic}</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Date & Time *
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 45)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Rescheduling...' : 'Reschedule Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;