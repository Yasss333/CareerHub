import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { getInterview, InterviewSession } from '../lib/interview'
import InterviewAnalytics from '../components/InterviewAnalytics'
import { summarizeInterviewAnalysis } from '../lib/interview-analysis'

const percentage = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'Not available'

export default function InterviewResults() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setSession((await getInterview(id)).session) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load interview results') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { void load() }, [load])

  const remove = async () => {
    if (!window.confirm('Delete this interview and all saved answers and analysis?')) return
    setDeleting(true)
    try { await api(`/interview/sessions/${id}`, { method: 'DELETE' }); navigate('/interview', { replace: true }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this interview'); setDeleting(false) }
  }

  if (loading) return <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Loading interview results…</div>
  if (!session) return <div role="alert" className="rounded-2xl border border-destructive/30 p-6">{error || 'Interview not found'} <button onClick={() => void load()} className="ml-3 underline">Retry</button></div>

  const feedback = session.feedback
  const analysis = summarizeInterviewAnalysis(session)
  const signals = [['Facial emotion', analysis.face], ['Voice emotion', analysis.voice], ['Text emotion', analysis.text]] as const
  const metrics = analysis.fusion?.behavioral_metrics as Record<string, number> | undefined
  const fusionEmotions = analysis.fusion?.emotions as Record<string, number> | undefined

  return <div className="mx-auto max-w-5xl space-y-7 pb-12">
    <Link to="/interview" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Interview history</Link>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-destructive">{error}</p>}
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold capitalize text-primary">{session.status.replaceAll('_', ' ')}</p><h1 className="mt-2 text-3xl font-bold text-card-foreground">Interview performance report</h1><p className="mt-2 text-sm text-muted-foreground">{session.role || session.type.replaceAll('_', ' ')} · {session.topics.join(' · ')}</p></div>
      <div className="flex gap-2"><Link to="/interview/setup" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"><RotateCcw className="size-4" />Practice again</Link><button onClick={() => void remove()} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 text-sm disabled:opacity-50"><Trash2 className="size-4" />{deleting ? 'Deleting…' : 'Delete'}</button></div>
    </header>
    {session.status === 'in_progress' && <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">This interview has not been evaluated. <Link className="font-semibold text-primary underline" to={`/interview/session/${id}`}>Resume interview</Link></p>}
    <InterviewAnalytics session={session} />
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-card-foreground">AI coach feedback</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{feedback?.overallFeedback || 'Feedback is not available yet. Finish and evaluate the interview to receive coaching.'}</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{[['Strengths', feedback?.strengths], ['Areas to improve', feedback?.areasToImprove]].map(([label, entries]) => <div key={label as string}><h3 className="font-semibold text-card-foreground">{label}</h3>{Array.isArray(entries) && entries.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{entries.map((entry, index) => <li key={index}>{entry}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No feedback recorded.</p>}</div>)}</div>
    </section>
    <section className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-card-foreground">Optional coaching signals</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Model estimates support personal reflection. Emotion and behavioral estimates are not measurements of ability and do not affect your answer score or PRI.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {signals.map(([label, result]) => <article key={label} className="rounded-2xl border border-border bg-card p-4"><h3 className="text-sm font-semibold text-muted-foreground">{label}</h3><p className="mt-3 text-xl font-bold capitalize text-card-foreground">{typeof result?.emotion === 'string' ? result.emotion : 'Not available'}</p><p className="mt-2 text-xs text-muted-foreground">{result ? `Model confidence: ${percentage(result.confidence)}` : 'No verified model output was recorded.'}</p></article>)}
        <article className="rounded-2xl border border-border bg-card p-4"><h3 className="text-sm font-semibold text-muted-foreground">Identity checks</h3><p className="mt-3 text-lg font-bold text-card-foreground">{analysis.verification}</p><p className="mt-2 text-xs text-muted-foreground">{session.proctoringEvents?.length || 0} recorded events. A lack of events does not establish verification.</p></article>
      </div>
      {fusionEmotions && <div className="mt-6"><h3 className="font-semibold text-card-foreground">Combined emotion distribution</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(fusionEmotions).map(([emotion, value]) => <div key={emotion}><div className="flex justify-between text-xs capitalize text-muted-foreground"><span>{emotion}</span><span>{percentage(value)}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: percentage(value) }} /></div></div>)}</div></div>}
      {metrics && Object.keys(metrics).length > 0 && <div className="mt-6"><h3 className="font-semibold text-card-foreground">Experimental behavioral estimates</h3><dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(metrics).map(([label, value]) => <div key={label} className="rounded-xl border border-border p-3"><dt className="text-xs capitalize text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value.toFixed(1)}</dd></div>)}</dl></div>}
    </section>
    <section className="space-y-4"><h2 className="text-xl font-bold text-card-foreground">Question-by-question feedback</h2>{session.questions?.map((question, index) => <article key={question.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex justify-between gap-3"><span className="text-xs font-semibold text-primary">Question {index + 1} · {question.topic || question.category || 'General'}</span>{typeof question.questionFeedback?.score === 'number' && <span className="font-semibold text-primary">{Math.round(question.questionFeedback.score)}%</span>}</div><h3 className="mt-3 font-semibold text-card-foreground">{question.questionText}</h3><p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm">{question.answerText || 'No answer recorded.'}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{question.questionFeedback?.feedback || 'No evaluation recorded for this question.'}</p>{[['Strengths', question.questionFeedback?.strengths], ['Improvements', question.questionFeedback?.improvements], ['Missed points', question.questionFeedback?.missedPoints]].map(([label, entries]) => Array.isArray(entries) && entries.length > 0 && <div key={label as string} className="mt-3"><h4 className="text-sm font-semibold">{label}</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{entries.map((entry, i) => <li key={i}>{entry}</li>)}</ul></div>)}</article>)}</section>
    {(session.proctoringEvents?.length || 0) > 0 && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Session events</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{session.proctoringEvents?.map((event) => <li key={event.id}>{new Date(event.createdAt).toLocaleTimeString()} · {event.eventType.replaceAll('_', ' ')} · {event.severity}</li>)}</ul></section>}
  </div>
}
