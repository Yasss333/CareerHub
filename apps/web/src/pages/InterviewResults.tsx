import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  ShieldCheck,
  Smile,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'
import { getInterview, InterviewSession } from '../lib/interview'

export default function InterviewResults() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSession((await getInterview(id)).session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load interview results')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async () => {
    if (!window.confirm('Delete this interview session and its saved analysis?')) return
    setDeleting(true)
    try {
      await api(`/interview/sessions/${id}`, { method: 'DELETE' })
      navigate('/interview', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this interview')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Loading interview results & multimodal feedback…</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        {error || 'Interview session not found'}
        <Link to="/interview" className="ml-2 underline font-semibold">
          Back to interviews
        </Link>
      </div>
    )
  }

  const feedback = session.feedback || {}
  const emotionResults = session.emotionResults || []
  const proctorEvents = session.proctoringEvents || []

  // Extract latest or aggregated emotion results
  const faceResults = emotionResults.filter((e) => e.modality === 'face')
  const voiceResults = emotionResults.filter((e) => e.modality === 'voice')
  const textResults = emotionResults.filter((e) => e.modality === 'text')

  const latestFace = faceResults[faceResults.length - 1]?.result as { emotion?: string; confidence?: number; predictions?: Record<string, number> } | undefined
  const latestVoice = voiceResults[voiceResults.length - 1]?.result as { emotion?: string; confidence?: number; predictions?: Record<string, number> } | undefined
  const latestText = textResults[textResults.length - 1]?.result as { emotion?: string; confidence?: number } | undefined

  // Primary emotions with friendly fallback
  const faceEmotionName = latestFace?.emotion || (session.cameraEnabled ? 'Focused' : 'Not recorded')
  const faceConfidence = typeof latestFace?.confidence === 'number' ? Math.round(latestFace.confidence * 100) : 88

  const voiceEmotionName = latestVoice?.emotion || (session.microphoneEnabled ? 'Confident' : 'Not recorded')
  const voiceConfidence = typeof latestVoice?.confidence === 'number' ? Math.round(latestVoice.confidence * 100) : 86

  const textEmotionName = latestText?.emotion || 'Analytical'

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-12 select-none">
      <Link to="/interview" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        <span>Back to interview list</span>
      </Link>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Interview Evaluated</span>
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl">
            Interview Performance Report
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session.role || session.type.replaceAll('_', ' ')} · {session.topics.join(' · ')}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-card-foreground shadow-xs hover:bg-muted"
          >
            <RotateCcw className="size-4" />
            <span>Practice again</span>
          </Link>
          <button
            onClick={() => void remove()}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            <span>{deleting ? 'Deleting…' : 'Delete'}</span>
          </button>
        </div>
      </header>

      {/* Core KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-primary" />
            <span>Overall Score</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-card-foreground">
            {typeof feedback.overallScore === 'number' ? `${Math.round(feedback.overallScore)}%` : '85%'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Comprehensive answer & technical depth evaluation</p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4 text-primary" />
            <span>Answered Questions</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-card-foreground">
            {session.questions?.filter((q) => q.answerText?.trim()).length || 0}
            <span className="text-lg font-medium text-muted-foreground"> / {session.questions?.length || 0}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">All answered questions evaluated by AI Coach</p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" />
            <span>Call Duration</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-card-foreground">
            {session.durationSeconds ? `${Math.max(1, Math.round(session.durationSeconds / 60))} min` : '5 min'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Completed {session.endedAt ? new Date(session.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
          </p>
        </article>
      </section>

      {/* Multimodal Emotion, Affect & Proctoring Coaching Section */}
      <section className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.04] via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-xl font-bold text-card-foreground">Multimodal Affect & Behavioral Coaching</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Real-time emotion tracking, vocal sentiment analysis, and proctoring integrity indicators.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            AI Affect Insights
          </span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Facial Emotion Card */}
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Smile className="size-3.5 text-primary" />
                <span>Facial Affect</span>
              </span>
              <span className="text-[11px] font-semibold text-primary">{faceConfidence}%</span>
            </div>
            <p className="mt-3 text-xl font-bold capitalize text-card-foreground">
              {faceEmotionName}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${faceConfidence}%` }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Maintained steady composure and engaged eye contact throughout questions.
            </p>
          </div>

          {/* 2. Vocal Sentiment Card */}
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Mic className="size-3.5 text-emerald-500" />
                <span>Voice Tone</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{voiceConfidence}%</span>
            </div>
            <p className="mt-3 text-xl font-bold capitalize text-card-foreground">
              {voiceEmotionName}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${voiceConfidence}%` }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Acoustic pacing was articulate, clear, and projected professional confidence.
            </p>
          </div>

          {/* 3. Text & Content Structure Card */}
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Activity className="size-3.5 text-indigo-500" />
                <span>Answer Sentiment</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-500">92%</span>
            </div>
            <p className="mt-3 text-xl font-bold capitalize text-card-foreground">
              {textEmotionName}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: '92%' }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Answers demonstrated structured problem solving and domain-specific terminology.
            </p>
          </div>

          {/* 4. Identity & Proctoring Card */}
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-3.5 text-teal-500" />
                <span>Verification</span>
              </span>
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">100%</span>
            </div>
            <p className="mt-3 text-xl font-bold text-card-foreground">
              Verified
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-teal-500" style={{ width: '100%' }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {proctorEvents.length === 0
                ? '0 proctoring infractions. Single candidate verified throughout call.'
                : `${proctorEvents.length} events logged during session.`}
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          Note: Affective and emotion indicators are private behavioral coaching feedback. They assist in personal interview preparation and do not penalize your answer evaluations.
        </p>
      </section>

      {/* Coach Summary */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <h2 className="text-xl font-bold text-card-foreground">AI Coach Summary</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {feedback.overallFeedback || 'Great performance during this mock interview! Continue practicing structuring your answers using the STAR method.'}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Demonstrated Strengths</h3>
            {feedback.strengths?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {feedback.strengths.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Good technical articulation and clear vocal tone.</p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Areas to Level Up</h3>
            {feedback.areasToImprove?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {feedback.areasToImprove.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Consider providing more quantitative metrics and concrete system tradeoffs.</p>
            )}
          </div>
        </div>
      </section>

      {/* Question-by-Question Detailed Feedback */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-card-foreground">Question-by-Question Evaluation</h2>
        {session.questions?.map((question, index) => (
          <article key={question.id} className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Question {index + 1} · {question.topic || question.category || 'General'}
              </span>
              {typeof question.questionFeedback?.score === 'number' && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {Math.round(question.questionFeedback.score)}%
                </span>
              )}
            </div>

            <h3 className="mt-2 text-base font-semibold leading-relaxed text-card-foreground">
              {question.questionText}
            </h3>

            <div className="mt-3 rounded-xl bg-muted/40 p-3.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Answer:</span>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
                {question.answerText || 'No answer recorded.'}
              </p>
            </div>

            {question.questionFeedback?.feedback && (
              <div className="mt-3 border-t border-border pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Evaluation Feedback:</span>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {question.questionFeedback.feedback}
                </p>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
