import {useCallback, useEffect, useRef, useState} from 'react'
import {Camera, CheckCircle2, Mic, MonitorUp, Volume2} from 'lucide-react'
import {useInterviewMedia} from '../contexts/useInterviewMedia'

export type PreflightState = {camera: boolean; microphone: boolean}
type Props = {cameraConsent: boolean; microphoneConsent: boolean; proctored: boolean; onReady: (state: PreflightState) => void; releaseRef: React.MutableRefObject<() => void>}
export default function InterviewPreflight({cameraConsent, microphoneConsent, proctored, onReady, releaseRef}: Props) {
  const media = useInterviewMedia()
  const stageDevice = media.stageDevice
  const camera = useRef<MediaStream | null>(null)
  const microphone = useRef<MediaStream | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const animation = useRef(0)
  const disposed = useRef(false)
  const consent = useRef({camera: cameraConsent, microphone: microphoneConsent})
  consent.current = {camera: cameraConsent, microphone: microphoneConsent}
  const readiness = useRef<PreflightState>({camera: false, microphone: false})
  const callback = useRef(onReady); callback.current = onReady
  const [ready, setReady] = useState(readiness.current)
  const [level, setLevel] = useState(0)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState('')
  const update = (device: keyof PreflightState, value: boolean) => {readiness.current = {...readiness.current, [device]: value}; setReady(readiness.current); callback.current(readiness.current)}
  const release = useCallback((transfer = false) => {
    if (transfer && camera.current) stageDevice('camera', camera.current)
    else camera.current?.getTracks().forEach(t => t.stop())
    camera.current = null
    if (transfer && microphone.current) stageDevice('microphone', microphone.current)
    else microphone.current?.getTracks().forEach(t => t.stop())
    microphone.current = null
    cancelAnimationFrame(animation.current); void audio.current?.close().catch(() => undefined); audio.current = null
  }, [stageDevice])
  releaseRef.current = () => release(true)
  useEffect(() => {disposed.current = false; return () => {disposed.current = true; release()}}, [release])
  useEffect(() => {if (!cameraConsent) {camera.current?.getTracks().forEach(t => t.stop()); camera.current = null; update('camera', false)}}, [cameraConsent])
  useEffect(() => {if (!microphoneConsent) {microphone.current?.getTracks().forEach(t => t.stop()); microphone.current = null; cancelAnimationFrame(animation.current); void audio.current?.close().catch(() => undefined); audio.current = null; setLevel(0); update('microphone', false)}}, [microphoneConsent])
  const test = async (device: keyof PreflightState) => {
    if (pending) return
    setPending(device); setMessage('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use a supported browser on HTTPS or localhost to test your devices.')
      const stream = await navigator.mediaDevices.getUserMedia(device === 'camera' ? {video: {width: {ideal: 640}, height: {ideal: 360}}, audio: false} : {audio: {echoCancellation: true, noiseSuppression: true}, video: false})
      if (disposed.current || !consent.current[device]) {stream.getTracks().forEach(t => t.stop()); return}
      if (device === 'camera') {
        camera.current?.getTracks().forEach(t => t.stop()); camera.current = stream
        if (video.current) {video.current.srcObject = stream; await video.current.play()}
        update('camera', true)
      } else {
        microphone.current?.getTracks().forEach(t => t.stop()); cancelAnimationFrame(animation.current); await audio.current?.close()
        microphone.current = stream; const context = new AudioContext(); audio.current = context; await context.resume()
        const analyser = context.createAnalyser(); analyser.fftSize = 1024; context.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        const measure = () => {
          if (disposed.current || microphone.current !== stream) return
          analyser.getByteTimeDomainData(data)
          const rms = Math.sqrt(data.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / data.length)
          setLevel(Math.min(100, Math.round(rms * 500)))
          animation.current = requestAnimationFrame(measure)
        }
        measure(); update('microphone', true)
      }
      stream.getTracks().forEach(track => track.addEventListener('ended', () => {if (!disposed.current) update(device, false)}, {once: true}))
    } catch (err) {
      update(device, false)
      setMessage(err instanceof DOMException ? `${device === 'camera' ? 'Camera' : 'Microphone'} could not start (${err.name}). Allow it in your browser’s site settings, close other apps using it, and retry.` : err instanceof Error ? err.message : 'Device test failed. Please retry.')
    } finally {setPending('')}
  }
  return <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
    <p className="text-xs font-bold uppercase tracking-widest text-primary">Before you join</p><h2 className="mt-2 text-xl font-bold">Camera, sound & screen check</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Check your preview and speak a few words. These checks stay on your device. Interview coaching begins after you join.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="relative overflow-hidden rounded-2xl bg-black"><video ref={video} autoPlay playsInline muted aria-label="Preflight camera preview" className="aspect-video w-full object-cover"/>{!ready.camera && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Your camera preview</div>}</div><div className="flex flex-col justify-center gap-3"><button type="button" onClick={() => void test('camera')} disabled={!cameraConsent || !!pending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-40"><Camera className="size-4"/>{pending === 'camera' ? 'Opening camera…' : ready.camera ? 'Retest camera' : 'Test camera'}{ready.camera && <CheckCircle2 className="size-4 text-emerald-500"/>}</button><button type="button" onClick={() => void test('microphone')} disabled={!microphoneConsent || !!pending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-40"><Mic className="size-4"/>{pending === 'microphone' ? 'Opening microphone…' : ready.microphone ? 'Retest microphone' : 'Test microphone'}{ready.microphone && <CheckCircle2 className="size-4 text-emerald-500"/>}</button><div role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500 transition-[width]" style={{width: `${level}%`}}/></div><p className="text-xs text-muted-foreground">{ready.microphone ? 'Microphone connected. Speak and check that the level moves.' : 'Enable consent above to test each device.'}</p><button type="button" onClick={() => {window.speechSynthesis?.cancel(); window.speechSynthesis?.speak(new SpeechSynthesisUtterance('Hello, I’m Maya, your CareerHub interviewer. Can you hear me clearly?'))}} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Volume2 className="size-4"/>Play test sound</button></div></div>
    {proctored && <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><h3 className="flex items-center gap-2 font-semibold"><MonitorUp className="size-4 text-primary"/>Entire-screen monitoring</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Choose “Entire screen”, then select a monitor. Sharing status and focus changes are recorded; screen images are not uploaded or saved. Keep sharing until you finish. Browser monitoring cannot detect another device.</p><button type="button" onClick={() => void media.startScreen()} className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{media.sharing ? 'Entire screen selected · Change screen' : 'Share entire screen'}</button>{media.sharing && <p role="status" className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Entire screen ready</p>}{media.screenError && <p role="alert" className="mt-2 text-sm text-destructive">{media.screenError}</p>}</div>}
    {message && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
  </section>
}
