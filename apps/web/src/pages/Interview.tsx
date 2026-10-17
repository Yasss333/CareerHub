import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Loader2, MessageSquare, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { InterviewSession, listInterviews } from '../lib/interview'

export default function Interview() {
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setSessions((await listInterviews()).sessions) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load interview history') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  return <div className="mx-auto max-w-5xl space-y-7 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Practice with an AI coach</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl">AI Interview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Build confidence with role-specific questions, thoughtful feedback, and optional voice and camera coaching.</p></div>
      <Link to="/interview/setup" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="size-4" /> Start an interview</Link>
    </header>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><span>{error}</span><button onClick={() => void load()} className="inline-flex items-center gap-2 font-semibold"><RefreshCw className="size-4" /> Retry</button></div>}
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Your practice</p><h2 className="mt-1 text-xl font-bold text-card-foreground">Interview history</h2></div><span className="text-sm text-muted-foreground">{sessions.length} sessions</span></div>
      {loading ? <div role="status" className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /> Loading your interviews…</div> : sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center"><MessageSquare className="mx-auto size-8 text-primary" /><h3 className="mt-3 font-semibold text-card-foreground">Your first practice starts here</h3><p className="mt-1 text-sm text-muted-foreground">Choose a role and topics to build a tailored mock interview.</p><Link to="/interview/setup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Set up an interview <ArrowRight className="size-4" /></Link></div> : <div className="space-y-3">{sessions.map((session) => <Link key={session.id} to={session.status === 'completed' ? `/interview/results/${session.id}` : `/interview/session/${session.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary/[0.03]"><div><h3 className="font-semibold text-card-foreground">{session.role || `${session.type.replaceAll('_', ' ')} interview`}</h3><p className="mt-1 text-sm text-muted-foreground">{session.topics.join(' · ')}</p><p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{new Date(session.createdAt || session.startedAt).toLocaleString()} · {session.questions?.length || 0} questions</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{session.status.replaceAll('_', ' ')}</span></Link>)}</div>}
    </section>
  </div>
}
