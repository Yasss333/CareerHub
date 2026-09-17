import { useState } from 'react';
import { useApp } from '@/store';
import { seniors } from '@/mockData';
import type { Session } from '@/types';
import { CredibilityBadge } from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  MessageSquare,
} from 'lucide-react';

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function BookingPage() {
  const { selectedSeniorId, navigate, addSession } = useApp();
  const [step, setStep] = useState<'slot' | 'topic' | 'confirm'>('slot');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const senior = seniors.find((s) => s.id === selectedSeniorId);

  if (!senior) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-secondary-500">Select a mentor to book a session.</p>
        <button onClick={() => navigate('discover')} className="btn-primary mt-4">Discover seniors</button>
      </div>
    );
  }

  const availableSlots = senior.slots.filter((s) => s.available);
  const groupedByDate = availableSlots.reduce((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {} as Record<string, typeof availableSlots>);

  const dateKeys = Object.keys(groupedByDate);

  const handleConfirm = () => {
    const newSession: Session = {
      id: `ses-${Date.now()}`,
      seniorId: senior.id,
      seniorName: senior.name,
      seniorAvatar: senior.avatar,
      juniorName: 'Rohan Verma',
      date: selectedDate!,
      time: selectedTime!,
      duration,
      topic,
      status: 'upcoming',
      meetingLink: `https://meet.example.com/ses-${Date.now()}`,
      notes: notes || undefined,
    };
    addSession(newSession);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card animate-scale-in p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-secondary-900">Session booked!</h2>
          <p className="mt-2 text-sm text-secondary-500">
            Your session with {senior.name} is confirmed for {formatDateFull(selectedDate!)} at {selectedTime}.
          </p>
          <div className="mt-6 rounded-xl bg-secondary-50 p-4 text-left">
            <div className="flex items-center gap-3">
              <img src={senior.avatar} alt={senior.name} className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-sm font-semibold text-secondary-800">{senior.name}</p>
                <p className="text-xs text-secondary-400">{senior.title} · {senior.company}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-secondary-200 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-secondary-400">Date</span><span className="font-medium text-secondary-700">{formatDateShort(selectedDate!)}</span></div>
              <div className="flex justify-between"><span className="text-secondary-400">Time</span><span className="font-medium text-secondary-700">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-secondary-400">Duration</span><span className="font-medium text-secondary-700">{duration} min</span></div>
              <div className="flex justify-between"><span className="text-secondary-400">Topic</span><span className="font-medium text-secondary-700">{topic}</span></div>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate('bookings')} className="btn-primary">View bookings</button>
            <button onClick={() => navigate('discover')} className="btn-secondary">Browse more</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate('senior-profile')} className="flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-secondary-800">
        <ArrowLeft className="h-4 w-4" /> Back to {senior.name}'s profile
      </button>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { id: 'slot' as const, label: 'Pick a slot' },
          { id: 'topic' as const, label: 'Session details' },
          { id: 'confirm' as const, label: 'Confirm' },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step === s.id ? 'bg-primary-600 text-white' :
              (s.id === 'topic' && step === 'confirm') || (s.id === 'slot' && step !== 'slot') ? 'bg-success-500 text-white' : 'bg-secondary-200 text-secondary-500'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s.id ? 'text-secondary-800' : 'text-secondary-400'}`}>{s.label}</span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-secondary-300" />}
          </div>
        ))}
      </div>

      {/* Mentor summary */}
      <div className="card flex items-center gap-4 p-5">
        <img src={senior.avatar} alt={senior.name} className="h-12 w-12 rounded-xl ring-2 ring-primary-100" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-secondary-800">{senior.name}</p>
            <CredibilityBadge score={senior.credibilityScore} size="sm" />
          </div>
          <p className="text-sm text-secondary-500">{senior.title} · {senior.company}</p>
        </div>
      </div>

      {/* Step 1: Slot */}
      {step === 'slot' && (
        <div className="card animate-fade-in p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <Calendar className="h-4 w-4 text-primary-600" /> Choose a date & time
          </h3>
          <div className="space-y-4">
            {dateKeys.map((date) => (
              <div key={date}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                  {formatDateShort(date)}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {groupedByDate[date].map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => { setSelectedDate(date); setSelectedTime(slot.time); }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        selectedDate === date && selectedTime === slot.time
                          ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100'
                          : 'border-secondary-200 text-secondary-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Duration */}
          <div className="mt-6 border-t border-secondary-100 pt-4">
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-secondary-400">Session duration</h4>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    duration === d
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100'
                      : 'border-secondary-200 text-secondary-700 hover:border-primary-300'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep('topic')}
              disabled={!selectedDate || !selectedTime}
              className="btn-primary"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Topic */}
      {step === 'topic' && (
        <div className="card animate-fade-in space-y-5 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <MessageSquare className="h-4 w-4 text-primary-600" /> Session details
          </h3>

          <div>
            <label className="label">What would you like to discuss?</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. System design for a URL shortener"
              className="input"
            />
          </div>

          <div>
            <label className="label">Notes for your mentor (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share context, specific questions, or what you hope to get out of the session..."
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* Suggested topics */}
          <div>
            <p className="mb-2 text-xs font-medium text-secondary-400">Suggested topics</p>
            <div className="flex flex-wrap gap-2">
              {['Career guidance', 'System design', 'Interview prep', 'Code review', 'Project feedback'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="chip-secondary hover:chip-primary hover:bg-primary-50 hover:text-primary-700"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('slot')} className="btn-secondary">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => setStep('confirm')} disabled={!topic} className="btn-primary">
              Review <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="card animate-fade-in p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-secondary-700">
            <CheckCircle2 className="h-4 w-4 text-primary-600" /> Review your booking
          </h3>

          <div className="space-y-3 rounded-xl bg-secondary-50 p-4">
            <div className="flex items-center gap-3 border-b border-secondary-200 pb-3">
              <img src={senior.avatar} alt={senior.name} className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-sm font-semibold text-secondary-800">{senior.name}</p>
                <p className="text-xs text-secondary-400">{senior.title} · {senior.company}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-secondary-400"><Calendar className="h-4 w-4" /> Date</span>
              <span className="font-medium text-secondary-700">{formatDateShort(selectedDate!)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-secondary-400"><Clock className="h-4 w-4" /> Time</span>
              <span className="font-medium text-secondary-700">{selectedTime} · {duration} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-secondary-400"><MessageSquare className="h-4 w-4" /> Topic</span>
              <span className="font-medium text-secondary-700">{topic}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-secondary-400"><Video className="h-4 w-4" /> Format</span>
              <span className="font-medium text-secondary-700">1-on-1 video</span>
            </div>
            {notes && (
              <div className="border-t border-secondary-200 pt-3">
                <span className="flex items-center gap-1.5 text-xs text-secondary-400"><User className="h-3.5 w-3.5" /> Your notes</span>
                <p className="mt-1 text-sm text-secondary-600">{notes}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep('topic')} className="btn-secondary">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={handleConfirm} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" /> Confirm booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
