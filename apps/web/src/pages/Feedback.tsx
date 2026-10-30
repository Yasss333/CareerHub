import {useCallback, useEffect, useRef, useState} from 'react'
import {Link} from 'react-router-dom'
import {Bug, Download, Loader2, MessageSquare, RefreshCw} from 'lucide-react'
import {feedbackLabels, listFeedback, updateFeedback, type FeedbackReport} from '../lib/feedback'

const fieldClass = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm'
function ReportCard({report, adminView, onUpdate}: {report: FeedbackReport; adminView: boolean; onUpdate: (report: FeedbackReport) => void}) {
  const [status, setStatus] = useState(report.status)
  const [note, setNote] = useState(report.resolutionNote)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => {setStatus(report.status); setNote(report.resolutionNote)}, [report.status, report.resolutionNote])
  const save = async () => {
    if (busy) return
    setBusy(true); setError(''); setSaved(false)
    try { const result = await updateFeedback(report.id, status, note); onUpdate(result.report); setSaved(true) }
    catch (failure) {setError(failure instanceof Error ? failure.message : 'Could not save the update. Please retry.')}
    finally {setBusy(false)}
  }
  const {payload} = report
  return <article className="rounded-2xl border border-border bg-card p-5">
    <div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{payload.context.module || 'CareerHub'} · {payload.kind === 'bug' ? 'Bug' : 'Suggestion'} · <span className="font-mono">{report.id.slice(0, 8)}</span></p><h2 className="mt-2 break-words text-lg font-semibold">{payload.title}</h2></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{feedbackLabels[report.status]}</span></div>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{payload.description}</p>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><time dateTime={report.createdAt}>{new Date(report.createdAt).toLocaleString()}</time><Link className="break-all underline" to={payload.context.path}>Reported page</Link>{adminView && <span className="break-all">{report.user?.name || report.user?.email || 'Reporter'}</span>}</div>
    <details className="mt-4 rounded-xl bg-muted/40 p-3 text-sm"><summary className="cursor-pointer font-medium">Report details</summary><dl className="mt-3 space-y-3">{[['Steps', payload.steps], ['Expected', payload.expected], ['Actual', payload.actual]].filter(([,text]) => text).map(([label,text]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{text}</dd></div>)}<div><dt className="font-medium">Page</dt><dd className="mt-1 break-all text-muted-foreground">{payload.context.path}</dd></div><div><dt className="font-medium">Browser / viewport</dt><dd className="mt-1 break-words text-muted-foreground">{payload.context.browser || 'Not provided'} · {payload.context.viewport ? `${payload.context.viewport.width} × ${payload.context.viewport.height}` : 'Not provided'}</dd></div></dl></details>
    {report.resolutionNote && <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="text-xs font-semibold text-primary">Update from the team</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{report.resolutionNote}</p></div>}
    {adminView && <div className="mt-4 space-y-3 border-t border-border pt-4"><label className="block text-sm font-medium">Status<select aria-label={`Status for ${report.payload.title}`} className={fieldClass+' mt-1'} value={status} onChange={e => {setStatus(e.target.value as FeedbackReport['status']); setSaved(false)}}>{Object.entries(feedbackLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-medium">Update for the reporter<textarea maxLength={1500} rows={2} className={fieldClass+' mt-1'} value={note} onChange={e => {setNote(e.target.value); setSaved(false)}} placeholder="What was checked or fixed?"/></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex items-center gap-3"><button disabled={busy} onClick={() => void save()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Saving…' : 'Save update'}</button>{saved && <p role="status" className="text-sm text-emerald-600">Update saved</p>}</div></div>}
  </article>
}

export default function Feedback({adminView = false}: {adminView?: boolean}) {
  const [reports, setReports] = useState<FeedbackReport[]>([])
  const [status, setStatus] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const version = useRef(0)
  const load = useCallback(async (next = '') => {
    const current = ++version.current
    setLoading(true); setError('')
    try {
      const result = await listFeedback(adminView ? 'all' : 'mine', status, next)
      if (current !== version.current) return
      setReports(existing => next ? [...existing, ...result.reports.filter(row => !existing.some(item => item.id === row.id))] : result.reports)
      setCursor(result.nextCursor)
    } catch (failure) {if(current === version.current)setError(failure instanceof Error ? failure.message : 'Could not load feedback. Please retry.')}
    finally {if(current === version.current)setLoading(false)}
  }, [adminView, status])
  useEffect(() => {setReports([]); setCursor(null); void load(); return () => {version.current += 1}}, [load])
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({schemaVersion: 1, exportedAt: new Date().toISOString(), filter: status || 'ALL', reports}, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `careerhub-feedback-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="mx-auto max-w-4xl space-y-6 pb-10">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-primary"><Bug className="size-4"/>Feedback</p><h1 className="mt-2 text-3xl font-bold">{adminView ? 'User feedback' : 'My feedback'}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{adminView ? 'Review reports, track fixes, and keep reporters updated. Download JSON when you want to work through the loaded reports.' : 'Track your reports and read updates from the team. Use “Report a bug” in the header to send feedback from any page.'}</p></div>{adminView && <button disabled={!reports.length} onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"><Download className="size-4"/>Download loaded JSON</button>}</header>
    <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-medium">Filter by status<select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2"><option value="">All reports</option>{Object.entries(feedbackLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button disabled={loading} onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`}/>Refresh</button></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/25 p-4 text-sm text-destructive">{error} <button onClick={() => void load()} className="ml-2 font-semibold underline">Retry</button></p>}
    {loading && !reports.length && <p role="status" className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin"/>Loading feedback…</p>}
    {!loading && !error && !reports.length && <div className="rounded-2xl border border-dashed border-border p-10 text-center"><MessageSquare className="mx-auto size-8 text-muted-foreground"/><h2 className="mt-3 font-semibold">{status ? 'No reports with this status' : 'No feedback yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{adminView ? 'New reports will appear here.' : 'Found something that gets in your way? Report it from the header.'}</p></div>}
    <div className="space-y-4">{reports.map(report => <ReportCard key={report.id} report={report} adminView={adminView} onUpdate={updated => setReports(rows => rows.flatMap(row => row.id === updated.id ? (!status || updated.status === status ? [updated] : []) : [row]))}/>)}</div>
    {cursor && <button disabled={loading} onClick={() => void load(cursor)} className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-50">{loading ? 'Loading…' : 'Load more reports'}</button>}
  </div>
}
