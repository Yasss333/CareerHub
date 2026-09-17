import { useApp } from '@/store';
import { useState } from 'react';
import { sessionsApi } from '@/api';
import { RatingStars, EmptyState } from '@/components/ui';
import { Star } from 'lucide-react';

export function FeedbackPage() {
  const { sessions, selectedSessionId, navigate, markSessionFeedback } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const session = selectedSessionId ? sessions.find(s => s.id === selectedSessionId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setLoading(true);
    try {
      if (selectedSessionId) {
        await sessionsApi.submitFeedback(selectedSessionId, { rating, comment, tags });
        markSessionFeedback(selectedSessionId);
        navigate('bookings');
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <EmptyState icon={<Star />} title="No session selected" description="" />;
  }

  if (session.status !== 'completed') {
    return <EmptyState icon={<Star />} title="Can only review completed sessions" description="" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Share Your Feedback</h1>
        <p className="mt-2 text-secondary-500">Help us improve and let others know about your experience</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card space-y-6">
        {error && (
          <div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex items-start justify-between p-4 bg-secondary-50 rounded-lg">
          <div className="flex items-center gap-3">
            <img src={session.seniorAvatar} alt="" className="h-12 w-12 rounded-full" />
            <div>
              <p className="font-semibold text-secondary-900">{session.seniorName}</p>
              <p className="text-sm text-secondary-500">{session.topic}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label mb-4">How would you rate this session? <span className="text-error-600">*</span></label>
          <div className="flex gap-1 justify-center mb-4">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`p-2 transition-transform ${r <= rating ? 'scale-110' : ''}`}
              >
                <Star
                  className={`h-8 w-8 ${r <= rating ? 'fill-accent-400 text-accent-400' : 'text-secondary-200'}`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-lg font-bold text-secondary-900">{rating}/5</div>
        </div>

        <div>
          <label className="label">Your Feedback <span className="text-error-600">*</span></label>
          <textarea
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what you learned, what went well, and any suggestions for improvement..."
            rows={5}
            className="input w-full"
          />
        </div>

        <div>
          <label className="label mb-3">Tags (optional)</label>
          <div className="flex flex-wrap gap-2">
            {['Helpful', 'Inspiring', 'Patient', 'Knowledgeable', 'Good Communicator'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  tags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button type="button" onClick={() => navigate('bookings')} className="btn-secondary flex-1">
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
