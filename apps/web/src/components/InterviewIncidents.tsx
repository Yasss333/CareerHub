import {useEffect, useRef, useState} from 'react'
import {AlertTriangle, Maximize, ShieldCheck} from 'lucide-react'
import {InterviewSession, ProctorEvent} from '../lib/interview'

export default function InterviewIncidents({session}: {session: InterviewSession}) {
  const [events, setEvents] = useState(session.proctoringEvents || [])
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)
  const [error, setError] = useState('')
  const sessionId = useRef(session.id)
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    setEvents(previous => sessionId.current === session.id ? [...new Map([...previous,...(session.proctoringEvents || [])].map(e => [e.id,e])).values()] : (session.proctoringEvents || []))
    sessionId.current = session.id
  }, [session.id, session.proctoringEvents])
  useEffect(() => {
    const changed = () => setFullscreen(!!document.fullscreenElement)
    const received = (e: Event) => {
      const event = (e as CustomEvent<ProctorEvent>).detail
      if (event.sessionId !== session.id || !event.id) return
      setEvents(previous => previous.some(p => p.id === event.id) ? previous : [...previous,event].slice(-1200))
    }
    document.addEventListener('fullscreenchange',changed)
    window.addEventListener('careerhub:monitoring-event',received)
    return () => {document.removeEventListener('fullscreenchange',changed); window.removeEventListener('careerhub:monitoring-event',received)}
  }, [session.id])
  useEffect(() => {
    clearTimeout(exitTimer.current)
    return () => {exitTimer.current = setTimeout(() => {if(document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)},0)}
  }, [])
  const warnings = events.filter(e => e.severity === 'warning')
  const latest = warnings.slice(-4).reverse()
  return <section aria-label="Live proctoring incidents" className="rounded-2xl border border-border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary"/>Live monitoring · {warnings.length} {warnings.length === 1 ? 'incident' : 'incidents'}</h2>
      <span className="flex items-center gap-3 text-xs text-muted-foreground">{fullscreen ? 'Fullscreen active' : 'Fullscreen inactive'}{!fullscreen && <button type="button" onClick={() => {setError(''); if(!document.documentElement.requestFullscreen) {setError('Fullscreen is not supported in this browser. Use a desktop browser.'); return} void document.documentElement.requestFullscreen().catch(() => setError('Your browser blocked fullscreen. Select Enter fullscreen again.'))}} className="inline-flex items-center gap-1 font-semibold text-primary underline"><Maximize className="size-3.5"/>Enter fullscreen</button>}</span>
    </div>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">One ongoing issue counts once. Focus changes use a 2-second grace period and a 10-second cooldown. These signals do not prove cheating.</p>
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm">{latest.length ? <ul className="space-y-2">{latest.map(event => <li key={event.id} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500"/><span className="capitalize">{event.eventType.replaceAll('_',' ')} <time className="text-xs text-muted-foreground">· {new Date(event.createdAt).toLocaleTimeString()}</time></span></li>)}</ul> : 'No monitoring incidents recorded.'}</div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>
}
