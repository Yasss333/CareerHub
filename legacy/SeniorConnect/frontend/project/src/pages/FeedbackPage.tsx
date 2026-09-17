import { useState } from 'react';
import { useApp } from '@/store';
import { seniors } from '@/mockData';
import { RatingStars } from '@/components/ui';
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  ThumbsUp,
  MessageSquare,
  Send,
} from 'lucide-react';

export function FeedbackPage() {
  const { selectedSessionId, sessions, navigate } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const session = sessions.find((s) => s.id === selectedSessionId);
  const senior = session ? seniors.find((s) => s.id === session.seniorId) : null;

  if (!session || !senior) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-secondary-500">Session not found.</p>
        <button onClick={() => navigate('bookings')} className="btn-primary mt-4">Back to bookings</button>
      </div>
    );
  }

  const availableTags = [
    'Knowledgeable', 'Patient', 'Well-prepared', 'Great communicator',
    'Practical advice', 'Inspiring', 'Good listener', 'Clear explanations',
  ];

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card animate-scale-in p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-secondary-900">Thank you for your feedback!</h2>
          <p className="mt-2 text-sm text-secondary-500">
            Your review helps {senior.name} grow their credibility and helps other juniors find great mentors.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate('dashboard')} className="btn-primary">Back to dashboard</button>
            <button onClick={() => navigate('discover')} className="btn-secondary">Find another mentor</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate('session')} className="flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-secondary-800">
        <ArrowLeft className="h-4 w-4" /> Back to session
      </button>

      {/* Session summary */}
      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-400">Session with</p>
        <div className="flex items-center gap-3">
          <img src={senior.avatar} alt={senior.name} className="h-12 w-12 rounded-xl ring-2 ring-primary-100" />
          <div>
            <p className="font-semibold text-secondary-800">{senior.name}</p>
            <p className="text-sm text-secondary-500">{senior.title} · {senior.company}</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-secondary-50 p-3">
          <p className="text-sm font-medium text-secondary-700">{session.topic}</p>
          <p className="mt-0.5 text-xs text-secondary-400">
            {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.duration} min
          </p>
        </div>
      </div>

      {/* Feedback form */}
      <div className="card p-6">
        <h2 className="mb-1 font-display text-lg font-bold text-secondary-900">Rate your session</h2>
        <p className="mb-5 text-sm text-secondary-500">Your feedback is anonymous to other students but visible to the mentor.</p>

        {/* Rating */}
        <div className="mb-6">
          <label className="label">Overall rating</label>
          <div className="flex items-center gap-3">
            <RatingStars rating={rating} size={32} interactive onChange={setRating} />
            <span className="text-lg font-bold text-secondary-700">{rating}.0</span>
          </div>
          <p className="mt-1.5 text-xs text-secondary-400">
            {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Below average' : 'Poor'}
          </p>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="label">What stood out? (optional)</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  tags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {tags.includes(tag) && <CheckCircle2 className="h-3 w-3" />}
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="label">Your review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your session. What was helpful? What could be improved?"
            rows={5}
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-secondary-400">{comment.length}/500</p>
        </div>

        {/* Credibility impact */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-primary-50 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-800">Your feedback matters</p>
            <p className="text-xs text-primary-600">
              Reviews directly contribute to {senior.name}'s credibility score.
            </p>
          </div>
        </div>

        <button
          onClick={() => setSubmitted(true)}
          disabled={!comment.trim()}
          className="btn-primary w-full"
        >
          <Send className="h-4 w-4" /> Submit feedback
        </button>
      </div>
    </div>
  );
}
