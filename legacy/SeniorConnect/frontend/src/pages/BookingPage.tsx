import { useApp } from '@/store';
import { useState } from 'react';
import { sessionsApi } from '@/api';
import { EmptyState } from '@/components/ui';
import { Calendar, Clock, MessageCircle } from 'lucide-react';

export function BookingPage() {
  const { navigate, currentUser, addSession, selectedSeniorId } = useApp();
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('45');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !topic) {
      setError('Please fill in all required fields');
      return;
    }
    if (!selectedSeniorId) {
      setError('No mentor selected. Please select a mentor first.');
      return;
    }

    setLoading(true);
    try {
      const scheduledTime = new Date(`${date}T${time}`).toISOString();
      const session = await sessionsApi.book({
        seniorId: selectedSeniorId,
        scheduledTime,
        duration: parseInt(duration),
        topic,
        notes,
      });
      addSession(session);
      navigate('bookings');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to book session');
      } else {
        setError('Failed to book session');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <EmptyState icon={<Calendar />} title="Not authenticated" description="" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Book a Session</h1>
        <p className="mt-2 text-secondary-500">Schedule 1-on-1 time with a mentor</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card space-y-6">
        {error && (
          <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">Topic <span className="text-error-600">*</span></label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., System Design Interview Prep"
            className="input w-full"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">Date <span className="text-error-600">*</span></label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="label">Time <span className="text-error-600">*</span></label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="label">Duration (minutes)</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="input w-full">
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share any context or preparation for the session..."
            rows={4}
            className="input w-full"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Booking...' : 'Book Session'}
          </button>
          <button type="button" onClick={() => navigate('discover')} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
