import {useEffect, useRef, useState} from 'react'
import {AlertTriangle, Maximize, ShieldCheck} from 'lucide-react'
import {getProctorEvents, InterviewSession, ProctorEvent} from '../lib/interview'

const incidentLabel=(type:string)=>({face_multiple_faces:'Multiple faces detected',face_unauthorized_face:'Candidate identity mismatch',face_no_face:'No face detected',tab_hidden:'Interview tab hidden',window_blur:'Interview window lost focus',fullscreen_exited:'Fullscreen exited',camera_off:'Camera switched off',camera_unavailable:'Camera disconnected',screen_stopped:'Screen sharing stopped'} as Record<string,string>)[type]||type.replaceAll('_',' ')

export default function InterviewIncidents({session,compact=false}: {session: InterviewSession;compact?:boolean}) {
  const [events, setEvents] = useState(session.proctoringEvents || [])
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)
  const [error, setError] = useState('')
  const sessionId = useRef(session.id)
  const [syncError,setSyncError]=useState('')
  const [expanded,setExpanded]=useState(false)
  const [notice,setNotice]=useState<ProctorEvent|null>(null)
  useEffect(() => {
    const changed=sessionId.current!==session.id
    sessionId.current=session.id
    setEvents(previous => changed ? (session.proctoringEvents||[]) : [...new Map([...previous,...(session.proctoringEvents||[])].map(e=>[e.id,e])).values()])
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
  useEffect(()=>{
    if(session.status!=='in_progress')return
    let disposed=false,busy=false
    const refresh=async()=>{
      if(busy||document.hidden)return
      busy=true
      try {
        const {events:incoming}=await getProctorEvents(session.id)
        if(!disposed){setEvents(previous=>[...new Map([...previous,...(incoming||[])].map(e=>[e.id,e])).values()].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).slice(-1200));setSyncError('')}
      }catch{if(!disposed)setSyncError('Live monitoring is reconnecting. Saved incidents will refresh automatically.')}
      finally{busy=false}
    }
    void refresh()
    const timer=setInterval(()=>void refresh(),10000)
    window.addEventListener('focus',refresh)
    return()=>{disposed=true;clearInterval(timer);window.removeEventListener('focus',refresh)}
  },[session.id,session.status])
  const warnings = events.filter(e => e.severity === 'warning')
  const latest = warnings.slice(-4).reverse()
  const newest=warnings.at(-1)
  const newestRef=useRef(newest);newestRef.current=newest
  useEffect(()=>{
    if(!compact||!newestRef.current)return
    setNotice(newestRef.current)
    const timer=setTimeout(()=>setNotice(null),8000)
    return()=>clearTimeout(timer)
  },[compact,newest?.id])
  if(compact)return <section aria-label="Live proctoring incidents" className="contents">
    <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] ${warnings.length?'text-amber-300':'text-zinc-400'}`}><ShieldCheck className="size-3.5"/><span>{warnings.length}<span className="hidden sm:inline"> {warnings.length===1?'incident':'incidents'}</span></span><span className="sr-only">Live monitoring</span></button>
    {fullscreen?<span className="sr-only">Fullscreen active</span>:<button type="button" onClick={()=>{setError('');if(!document.documentElement.requestFullscreen){setError('Fullscreen is not supported in this browser.');return}void document.documentElement.requestFullscreen().catch(()=>setError('Your browser blocked fullscreen. Try again.'))}} title="Enter fullscreen" className="text-primary"><Maximize className="size-4"/><span className="sr-only">Enter fullscreen</span></button>}
    {(notice||expanded||syncError||error)&&<div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-amber-500/25 bg-zinc-900/95 p-3 text-xs shadow-xl backdrop-blur" role="status" aria-live="polite">
      {expanded?<><p className="mb-2 font-semibold">Live monitoring · {warnings.length} {warnings.length===1?'incident':'incidents'}</p><ul className="max-h-32 space-y-2 overflow-auto">{warnings.length?warnings.slice(-6).reverse().map(e=><li key={e.id}>{incidentLabel(e.eventType)} · {new Date(e.createdAt).toLocaleTimeString()}</li>):<li>No incidents recorded.</li>}</ul></>:notice&&<span className="inline-flex items-center gap-2 text-amber-200"><AlertTriangle className="size-3.5"/>{incidentLabel(notice.eventType)}</span>}
      {(syncError||error)&&<p className="mt-1 text-amber-300">{syncError||error}</p>}
    </div>}
  </section>
  return <section aria-label="Live proctoring incidents" className="sticky top-2 z-30 rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary"/>Live monitoring · {warnings.length} {warnings.length === 1 ? 'incident' : 'incidents'}</h2>
      <span className="flex items-center gap-3 text-xs text-muted-foreground">{fullscreen ? 'Fullscreen active' : 'Fullscreen inactive'}{!fullscreen && <button type="button" onClick={() => {setError(''); if(!document.documentElement.requestFullscreen) {setError('Fullscreen is not supported in this browser. Use a desktop browser.'); return} void document.documentElement.requestFullscreen().catch(() => setError('Your browser blocked fullscreen. Select Enter fullscreen again.'))}} className="inline-flex items-center gap-1 font-semibold text-primary underline"><Maximize className="size-3.5"/>Enter fullscreen</button>}</span>
    </div>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">One ongoing issue counts once. Focus changes use a 2-second grace period and a 10-second cooldown. These signals do not prove cheating.</p>
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm">{latest.length ? <ul className="max-h-32 space-y-2 overflow-y-auto">{latest.map(event => <li key={event.id} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500"/><span className="capitalize">{({face_multiple_faces:'Multiple faces detected',face_unauthorized_face:'Candidate identity mismatch',face_no_face:'No face detected',tab_hidden:'Interview tab hidden',window_blur:'Interview window lost focus',fullscreen_exited:'Fullscreen exited',camera_off:'Camera switched off',camera_unavailable:'Camera disconnected',screen_stopped:'Screen sharing stopped'} as Record<string,string>)[event.eventType] || event.eventType.replaceAll('_',' ')} <time className="text-xs text-muted-foreground">· {new Date(event.createdAt).toLocaleTimeString()}</time></span></li>)}</ul> : 'No monitoring incidents recorded.'}</div>
    {syncError && <p role="status" className="mt-2 text-xs text-amber-600 dark:text-amber-400">{syncError}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>
}
