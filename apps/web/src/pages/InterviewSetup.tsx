import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Clock3, Loader2, Mic, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { InterviewSession, generateInterviewQuestions } from '../lib/interview'
import { interviewPresets } from '../lib/interview-presets'

const types = [
  ['technical', 'Technical'], ['behavioral', 'Behavioral'], ['system_design', 'System design'], ['mixed', 'Mixed practice']
]

export default function InterviewSetup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preset = interviewPresets.find((item) => item.id === searchParams.get('preset'))
  const [type, setType] = useState(preset?.type || 'technical')
  const [topics, setTopics] = useState(preset?.topics || 'Data structures, problem solving')
  const [role, setRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('Entry level')
  const [difficulty, setDifficulty] = useState('medium')
  const [plannedDuration, setPlannedDuration] = useState(preset ? 10 : 20)
  const [cameraConsent, setCameraConsent] = useState(false)
  const [microphoneConsent, setMicrophoneConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const topicList = topics.split(',').map((topic) => topic.trim()).filter(Boolean)
    if (!topicList.length) { setError('Add at least one topic for your interview.'); return }
    setLoading(true); setError('')
    try {
      const { session } = await api<{ session: InterviewSession }>('/interview/sessions', { method: 'POST', body: { type, topics: topicList, role, experienceLevel, difficulty, plannedDuration, consent: { camera: cameraConsent, microphone: microphoneConsent } } })
      try { await generateInterviewQuestions(session.id) }
      catch (generationError) {
        navigate(`/interview/session/${session.id}`, { state: { generationError: generationError instanceof Error ? generationError.message : 'Question generation failed' } })
        return
      }
      navigate(`/interview/session/${session.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create your interview'); setLoading(false) }
  }

  return <div className="mx-auto max-w-4xl space-y-7 pb-10">
    <Link to="/interview" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> AI Interview</Link>
    <header><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Personalized practice</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl">Set up your interview</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose what to practice. Camera and microphone coaching are optional and require your consent.</p></header>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold text-card-foreground">Interview focus</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{types.map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`rounded-xl border p-3 text-left text-sm font-semibold ${type === value ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/15' : 'border-border text-card-foreground'}`}>{label}</button>)}</div>
          <label className="mt-5 block"><span className="text-sm font-semibold text-card-foreground">Topics <span className="font-normal text-muted-foreground">(comma separated)</span></span><textarea required value={topics} onChange={(event) => setTopics(event.target.value)} maxLength={1000} rows={3} placeholder="Data structures, behavioral questions, system design" className="mt-2 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          <label className="mt-4 block"><span className="text-sm font-semibold text-card-foreground">Target role</span><input value={role} onChange={(event) => setRole(event.target.value)} maxLength={150} placeholder="e.g. Frontend Engineer" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold text-card-foreground">Experience</span><select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"><option>Entry level</option><option>Junior</option><option>Mid-level</option><option>Senior</option></select></label><label><span className="text-sm font-semibold text-card-foreground">Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="mixed">Mixed</option></select></label></div>
          <label className="mt-4 block"><span className="text-sm font-semibold text-card-foreground">Practice time: {plannedDuration} minutes</span><input type="range" min="10" max="60" step="5" value={plannedDuration} onChange={(event) => setPlannedDuration(Number(event.target.value))} className="mt-3 w-full accent-primary" /></label>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="text-xl font-bold text-card-foreground">Optional coaching signals</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Raw video and audio are processed temporarily and aren’t saved. You can still complete the interview with text answers if you decline either option.</p>
          <label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-border p-4"><input type="checkbox" checked={cameraConsent} onChange={(event) => setCameraConsent(event.target.checked)} className="mt-1 size-4 accent-primary" /><span><span className="flex items-center gap-2 text-sm font-semibold text-card-foreground"><Camera className="size-4 text-primary" /> Allow camera emotion coaching</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">I consent to temporary webcam frame analysis during this session. Frames won’t be stored.</span></span></label>
          <label className="mt-3 flex cursor-pointer gap-3 rounded-2xl border border-border p-4"><input type="checkbox" checked={microphoneConsent} onChange={(event) => setMicrophoneConsent(event.target.checked)} className="mt-1 size-4 accent-primary" /><span><span className="flex items-center gap-2 text-sm font-semibold text-card-foreground"><Mic className="size-4 text-primary" /> Allow microphone coaching</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">I consent to temporary speech analysis and browser transcription. Audio won’t be stored.</span></span></label>
        </section>
      </div>
      <aside className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-5 lg:sticky lg:top-6"><p className="flex items-center gap-2 text-sm font-semibold text-card-foreground"><Clock3 className="size-4 text-primary" /> About {plannedDuration} minutes</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Your AI coach will create role-aware questions, save your answers, and provide feedback when you finish.</p><button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <><Loader2 className="size-4 animate-spin" /> Preparing interview…</> : <>Start interview <ArrowRight className="size-4" /></>}</button></aside>
    </form>
  </div>
}
