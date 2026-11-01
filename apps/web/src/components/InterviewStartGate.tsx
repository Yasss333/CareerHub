import {useEffect,useRef} from 'react'
import {Link} from 'react-router-dom'
import {Loader2,Maximize,ShieldCheck} from 'lucide-react'

export default function InterviewStartGate({enter,error,entering}: {enter:()=>Promise<void>;error:string;entering:boolean}) {
  const button=useRef<HTMLButtonElement>(null)
  const container=useRef<HTMLDivElement>(null)
  useEffect(()=>{button.current?.focus()},[])
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Start interview fullscreen" ref={container} onKeyDown={event=>{
    if(event.key!=='Tab')return
    const controls=container.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')
    if(!controls?.length)return
    const first=controls[0],last=controls[controls.length-1]
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }}>
    <div className="w-full max-w-lg rounded-3xl border border-primary/20 bg-card p-6 shadow-xl sm:p-8">
      <ShieldCheck className="size-10 text-primary"/>
      <h2 className="mt-4 text-2xl font-bold">Your interview is ready</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter fullscreen to start or resume. Your saved answers stay in place. Live monitoring warnings will remain visible while you answer.</p>
      <button ref={button} data-enter-interview type="button" disabled={entering} onClick={()=>void enter()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{entering?<Loader2 className="size-4 animate-spin"/>:<Maximize className="size-4"/>}{entering?'Entering fullscreen…':'Enter fullscreen & start'}</button>
      {error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <Link to="/interview" className="mt-4 inline-block text-sm text-muted-foreground underline">Back to interviews</Link>
    </div>
  </div>
}
