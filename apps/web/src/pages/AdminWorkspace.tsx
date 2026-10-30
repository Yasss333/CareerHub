import {FormEvent, useCallback, useEffect, useRef, useState} from 'react'
import {Link, useLocation} from 'react-router-dom'
import {ArrowRight, CheckCircle2, Loader2, Search, ShieldCheck, Trash2} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '../components/ui/dialog'
import {api} from '../lib/api'

type Person = {id: string; name?: string; email: string}
type Row = Person & {
  type?: string; role?: string; mentorApprovalStatus?: string; createdAt?: string; title?: string; roleType?: string; status?: string; score?: number | null;
  user?: Person; actor?: Person; action?: string; targetId?: string; details?: {reason?: string; cancelledBookings?: number};
  seniorProfile?: {title: string; company: string; rating: number};
  _count?: Record<string, number>; monitoringMode?: string; completionPercent?: number; completedMilestones?: number;
  milestones?: Array<{id: string; title: string; isCompleted: boolean; completedAt?: string}>;
}
const sections: Record<string, {title: string; description: string}> = {
  users: {title: 'People', description: 'Accounts and activity across CareerHub.'},
  mentors: {title: 'Mentor directory', description: 'Manage the mentors candidates can discover and book.'},
  interviews: {title: 'Interview activity', description: 'Completion, saved scores and monitoring activity. Private answers remain in the candidate’s report.'},
  progress: {title: 'Learning progress', description: 'Real progress through existing roadmaps and milestones.'},
  audit: {title: 'Admin activity', description: 'A record of administrative changes and their reasons.'},
}
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '—'

export default function AdminWorkspace() {
  const location = useLocation()
  const section = location.pathname.split('/')[2] || 'overview'
  const loadVersion = useRef(0)
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<Row | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {setPage(1); setSearch(''); setQuery(''); setNotice('')}, [section])
  const load = useCallback(async () => {
    const version = ++loadVersion.current
    setLoading(true); setError('')
    try {
      if (section === 'overview') {const result = await api<Record<string, number>>('/admin/overview'); if (version === loadVersion.current) setStats(result)}
      else {
        const data = await api<{items: Row[]; hasMore: boolean}>(`/admin/${section}?page=${page}&q=${encodeURIComponent(query)}`)
        if (version === loadVersion.current) {setRows(data.items); setHasMore(data.hasMore)}
      }
    } catch (err) {if (version === loadVersion.current) setError(err instanceof Error ? err.message : 'Could not load admin data')}
    finally {if (version === loadVersion.current) setLoading(false)}
  }, [section, page, query])
  useEffect(() => {void load(); const version = loadVersion.current; return () => {if (loadVersion.current === version) loadVersion.current = version + 1}}, [load])
  const remove = async (event: FormEvent) => {
    event.preventDefault(); if (!removing) return
    setBusy(true); setError('')
    try {
      const result = await api<{cancelledBookings: number}>(`/admin/mentors/${removing.id}`, {method: 'DELETE', body: {confirmation: removing.id, reason}})
      setRemoving(null); setReason(''); setNotice(`Mentor removed. ${result.cancelledBookings} upcoming bookings cancelled. Account and past sessions preserved.`); await load()
    } catch (err) {setError(err instanceof Error ? err.message : 'Could not remove this mentor')}
    finally {setBusy(false)}
  }
  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"><ShieldCheck className="size-4"/>CareerHub control room</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{sections[section]?.title || 'Admin overview'}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{sections[section]?.description || 'A clear view of your community, interviews and learning. Choose an area to manage below.'}</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error} <button className="ml-2 underline" onClick={() => void load()}>Retry</button></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm">{notice}</p>}
    {section !== 'overview' && section !== 'audit' && <form onSubmit={e => {e.preventDefault(); setPage(1); setQuery(search)}} className="flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4"><Search className="size-4 text-muted-foreground"/><input aria-label="Search admin records" maxLength={120} value={search} onChange={e => setSearch(e.target.value)} placeholder={section === 'progress' ? 'Search roadmap, name or email…' : 'Search name or email…'} className="min-w-0 flex-1 bg-transparent py-3 outline-none"/></label><button className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Search</button></form>}
    {loading ? <div role="status" className="flex items-center gap-3 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin"/>Loading admin data…</div> : section === 'overview' ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['users', 'Accounts', 'users'], ['mentors', 'Active mentors', 'mentors'], ['pendingMentors', 'Awaiting review', 'mentor-applications'], ['completedInterviews', 'Completed interviews', 'interviews'], ['interviews', 'All interviews', 'interviews'], ['roadmaps', 'Learning roadmaps', 'progress'], ['openFeedback', 'Open feedback', 'feedback'], ['bookings', 'Active bookings', 'mentors']].map(([key, label, path]) => <Link key={key} to={`/admin/${path}`} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"><p className="text-sm text-muted-foreground">{label}</p><div className="mt-3 flex items-end justify-between"><strong className="text-3xl tabular-nums">{stats[key] ?? '—'}</strong><ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1"/></div></Link>)}</div>
      <div className="grid gap-4 sm:grid-cols-3">{[['mentor-applications', 'Review mentor applications', 'Approve candidates before they can offer sessions.'], ['feedback', 'Listen to your users', 'Triage bugs, post updates and export JSON.'], ['audit', 'Review admin changes', 'Trace mentor removals and their reasons.']].map(([path, title, description]) => <Link key={path} to={`/admin/${path}`} className="rounded-2xl border border-border p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></Link>)}</div>
    </> : <>
      <div className="space-y-3">{rows.length === 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No records found.</p>}{rows.map(row => <article key={row.id} className="min-w-0 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{section === 'progress' ? row.title : section === 'audit' ? row.action?.replaceAll('.', ' · ') : row.user?.name || row.user?.email || row.name || row.email}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{section === 'audit' ? `${row.actor?.email || 'Deleted admin'} · ${date(row.createdAt)}` : row.user?.email || row.email}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">{row.status?.replaceAll('_', ' ') || row.role || 'Admin change'}</span></div>
        {section === 'users' && <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{row._count?.interviewSessions || 0} interviews</span><span>{row._count?.roadmaps || 0} roadmaps</span><span>{row._count?.resumes || 0} resumes</span><span>Joined {date(row.createdAt)}</span></div>}
        {section === 'mentors' && <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{row.seniorProfile ? `${row.seniorProfile.title} · ${row.seniorProfile.company}` : 'Profile incomplete'} · {row._count?.sessionBookingsAsSenior || 0} bookings</p><button onClick={() => {setRemoving(row); setReason('')}} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive"><Trash2 className="size-4"/>Remove mentor</button></div>}
        {section === 'interviews' && <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{row.type?.replaceAll('_', ' ')} · {date(row.createdAt)}</span><span>Score: {typeof row.score === 'number' ? `${Math.round(row.score)}%` : 'Not evaluated'}</span><span>{row._count?.questions || 0} questions</span><span>{row._count?.proctoringEvents || 0} monitoring events</span><span>{row.monitoringMode === 'proctored' ? 'Screen monitored' : 'Practice'}</span></div>}
        {section === 'progress' && <><div className="mt-4 flex justify-between text-sm"><span>{row.completedMilestones} / {row.milestones?.length} milestones</span><strong className="text-primary">{row.completionPercent}%</strong></div><div role="progressbar" aria-label={`${row.title} completion`} aria-valuenow={row.completionPercent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width: `${row.completionPercent}%`}}/></div><details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">View milestones</summary><ul className="mt-3 space-y-2">{row.milestones?.map(m => <li key={m.id} className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className={`size-4 shrink-0 ${m.isCompleted ? 'text-emerald-500' : 'opacity-30'}`}/><span>{m.title} · {m.isCompleted ? `Completed ${date(m.completedAt)}` : 'Pending'}</span></li>)}</ul></details></>}
        {section === 'audit' && <div className="mt-3 space-y-1 text-sm text-muted-foreground"><p className="break-all">Target: {row.targetId}</p><p>{row.details?.reason}</p><p>{row.details?.cancelledBookings ?? 0} future bookings cancelled</p></div>}
      </article>)}</div>
      <div className="flex items-center justify-between gap-3"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {page}</span><button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40">Next</button></div>
    </>}
    <Dialog open={!!removing} onOpenChange={open => {if (!open && !busy) setRemoving(null)}}><DialogContent showCloseButton={!busy}>{removing && <form onSubmit={remove}><DialogTitle>Remove {removing.name || removing.email}?</DialogTitle><DialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">This removes their listing and mentor access and cancels future pending or accepted bookings. Their account, past sessions and ongoing calls are preserved.</DialogDescription><label className="mt-4 block text-sm font-semibold">Reason<textarea autoFocus required minLength={5} maxLength={500} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background p-3"/></label>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setRemoving(null)} className="rounded-lg border border-border px-4 py-2">Cancel</button><button disabled={busy} className="rounded-lg bg-destructive px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Removing…' : 'Confirm removal'}</button></div></form>}</DialogContent></Dialog>
  </div>
}
