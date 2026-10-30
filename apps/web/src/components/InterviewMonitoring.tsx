import {useEffect, useRef, useState} from 'react'
import {MonitorUp, ShieldCheck} from 'lucide-react'
import {useInterviewMedia} from '../contexts/useInterviewMedia'
import {saveProctorEvent} from '../lib/interview'

export default function InterviewMonitoring({id, active, onReady, onResume}: {id: string; active: boolean; onReady: (ready: boolean) => void; onResume: () => void}) {
  const media = useInterviewMedia()
  const previous = useRef<MediaStream | null>(null)
  const callback = useRef(onReady); callback.current = onReady
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!active) return
    let disposed = false
    const stopped = !!previous.current && !media.sharing
    previous.current = media.screen
    setSynced(false); callback.current(false)
    if (!media.sharing) {
      if (stopped) void saveProctorEvent(id, 'screen_stopped').catch(() => undefined)
      return
    }
    let started = false
    const send = async () => {
      try {
        await saveProctorEvent(id, !started ? 'screen_started' : 'screen_heartbeat')
        started = true
        if (!disposed) {setSynced(true); setError(''); callback.current(true)}
      } catch (err) {
        if (!disposed) {setSynced(false); callback.current(false); setError(err instanceof Error ? err.message : 'Monitoring could not sync. Retrying…')}
      }
    }
    void send()
    const timer = window.setInterval(() => void send(), 20000)
    return () => {disposed = true; clearInterval(timer)}
  }, [id, active, media.screen, media.sharing])
  useEffect(() => {
    if (!active) return
    const last: Record<string, number> = {}
    const event = (type: string) => {if (Date.now() - (last[type] || 0) < 5000) return; last[type] = Date.now(); void saveProctorEvent(id, type).catch(() => undefined)}
    const visibility = () => {if (document.hidden) event('tab_hidden')}
    const blur = () => event('window_blur')
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', blur)
    return () => {document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', blur)}
  }, [id, active])
  if (!active) return null
  return <section aria-label="Screen monitoring" className={`rounded-2xl border p-4 ${media.sharing && synced ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/10'}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4"/>{media.sharing && synced ? 'Entire screen shared · Monitoring connected' : 'Interview paused · Screen sharing required'}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{media.sharing ? 'Sharing status and focus events are recorded. Screen images stay on your device.' : 'Reshare an entire monitor to continue. Your current answer is retained.'}</p></div><button type="button" onClick={() => void media.startScreen()} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"><MonitorUp className="size-4"/>{media.sharing ? 'Change screen' : 'Share entire screen'}</button>{media.sharing && synced && <button type="button" onClick={onResume} className="text-sm font-semibold text-primary underline">Replay & resume</button>}</div>
    {(media.screenError || error) && <p role="alert" className="mt-2 text-sm text-destructive">{media.screenError || error}</p>}
  </section>
}
