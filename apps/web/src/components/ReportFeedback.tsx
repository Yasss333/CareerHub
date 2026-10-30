import {useRef, useState} from 'react'
import {Link, useLocation} from 'react-router-dom'
import {Bug, CheckCircle2, Loader2} from 'lucide-react'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from './ui/dialog'
import {createFeedback, type FeedbackPayload} from '../lib/feedback'

const empty = {kind: 'bug' as const, title: '', description: '', steps: '', expected: '', actual: ''}
const fieldClass = 'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function ReportFeedback({historyPath}: {historyPath: string}) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Omit<FeedbackPayload, 'context'>>({...empty})
  const [context, setContext] = useState<FeedbackPayload['context'] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState('')
  const attempt = useRef({requestId: '', body: ''})
  const changeOpen = (next: boolean) => {
    if (busy) return
    if (next) {
      setSavedId(''); setError('')
      if (![draft.title, draft.description, draft.steps, draft.expected, draft.actual].some(Boolean)) {
        setContext({path: location.pathname, browser: navigator.userAgent.slice(0, 250), viewport: {width: window.innerWidth, height: window.innerHeight}})
      }
    }
    setOpen(next)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !context) return
    setBusy(true); setError('')
    const payload = {...draft, context}
    const serialized = JSON.stringify(payload)
    if (!attempt.current.requestId || attempt.current.body !== serialized) attempt.current = {requestId: crypto.randomUUID(), body: serialized}
    try {
      const {report} = await createFeedback(attempt.current.requestId, payload)
      setSavedId(report.id); setDraft({...empty}); attempt.current = {requestId: '', body: ''}
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not send your report. Your draft is still here.') }
    finally { setBusy(false) }
  }
  const update = (key: keyof typeof draft, value: string) => setDraft(current => ({...current, [key]: value}))
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger aria-label="Report a bug" title="Report a bug or suggest an improvement" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:px-3">
      <Bug className="size-5"/><span className="hidden text-sm font-medium lg:inline">Report a bug</span>
    </DialogTrigger>
    <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{savedId ? 'Report received' : 'Help us improve CareerHub'}</DialogTitle><DialogDescription>{savedId ? 'You can follow its status in your feedback history.' : 'Tell us what went wrong or what would help. Specific steps make problems easier to fix.'}</DialogDescription></DialogHeader>
      {savedId ? <div className="space-y-5">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4"><CheckCircle2 className="mb-2 size-6 text-emerald-600"/><p role="status" className="font-semibold">Your feedback was saved.</p><p className="mt-1 text-sm text-muted-foreground">Reference <span className="font-mono">{savedId.slice(0, 8)}</span> · Open</p></div>
        <div className="flex justify-between gap-3"><Link to={historyPath} onClick={() => changeOpen(false)} className="text-sm font-medium text-primary underline">View feedback</Link><button type="button" onClick={() => changeOpen(false)} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground">Done</button></div>
      </div> : <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-75">
        <label className="block text-sm font-medium">Type<select aria-label="Feedback type" className={fieldClass} value={draft.kind} onChange={e => update('kind', e.target.value)}><option value="bug">Report a bug</option><option value="suggestion">Suggest an improvement</option></select></label>
        <label className="block text-sm font-medium">Short title<input required minLength={6} maxLength={140} className={fieldClass} value={draft.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Camera button does not start the preview"/></label>
        <label className="block text-sm font-medium">What happened?<textarea required minLength={10} maxLength={4000} rows={4} className={fieldClass} value={draft.description} onChange={e => update('description', e.target.value)} placeholder="Describe the problem or your suggestion…"/><span className="mt-1 block text-right text-xs font-normal text-muted-foreground">{draft.description.length}/4000</span></label>
        <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Add reproduction details (optional)</summary><div className="mt-3 space-y-3">
          <label className="block text-sm">Steps to reproduce<textarea rows={2} maxLength={2000} className={fieldClass} value={draft.steps} onChange={e => update('steps', e.target.value)}/></label>
          <label className="block text-sm">What did you expect?<textarea rows={2} maxLength={1000} className={fieldClass} value={draft.expected} onChange={e => update('expected', e.target.value)}/></label>
          <label className="block text-sm">What happened instead?<textarea rows={2} maxLength={1000} className={fieldClass} value={draft.actual} onChange={e => update('actual', e.target.value)}/></label>
        </div></details>
        <details className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">Page context attached</summary><p className="mt-2 break-all">{context?.path}</p><p className="mt-1">{context?.viewport.width} × {context?.viewport.height}</p><p className="mt-1 break-words">{context?.browser}</p></details>
        <p className="text-xs leading-5 text-muted-foreground">Only your description and the context above are attached. Please leave out passwords, API keys, and private interview answers. Reports are visible to you and administrators.</p>
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-destructive/25 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-3"><Link to={historyPath} aria-disabled={busy} onClick={event => {if (busy) event.preventDefault(); else changeOpen(false)}} className="text-sm text-muted-foreground underline">My feedback</Link><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="size-4 animate-spin"/>}{busy ? 'Sending…' : 'Send feedback'}</button></div>
      </form>}
    </DialogContent>
  </Dialog>
}
