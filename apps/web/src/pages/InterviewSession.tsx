import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CameraOff,
  Check,
  Clock,
  Edit3,
  Hand,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'
import InterviewMonitoring from '../components/InterviewMonitoring'
import InterviewIncidents from '../components/InterviewIncidents'
import {useInterviewMedia} from '../contexts/useInterviewMedia'
import AIInterviewerAvatar from '../components/AIInterviewerAvatar'
import {
  analyzeInterviewMedia,
  evaluateInterview,
  generateInterviewQuestions,
  getInterview,
  grantInterviewDeviceConsent,
  getInterviewCapabilities,
  InterviewCapabilities,
  InterviewQuestion,
  InterviewSession as SessionData,
  saveInterviewAnswer,
  saveInterviewIntroduction,
  saveProctorEvent,
} from '../lib/interview'
import { api } from '../lib/api'

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

export default function InterviewSessionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const media = useInterviewMedia()
  const takeDevice = media.takeDevice
  const [monitoringReady, setMonitoringReady] = useState(false)
  const monitoringBlockedRef = useRef(false)
  const [microphoneReady, setMicrophoneReady] = useState(false)

  // Interview session and questions
  const [session, setSession] = useState<SessionData | null>(null)
  const sessionRef = useRef<SessionData | null>(null)
  sessionRef.current = session
  monitoringBlockedRef.current = session?.monitoringMode === 'proctored' && (!media.sharing || !monitoringReady)
  const disposedRef = useRef(false)
  const [capabilities, setCapabilities] = useState<InterviewCapabilities | null>(null)
  const [analysisNotice, setAnalysisNotice] = useState('')
  const [fusionEmotion, setFusionEmotion] = useState('')
  const captureSuspendedRef = useRef(false)
  const recordingDoneRef = useRef<Promise<void>>(Promise.resolve())
  const audioStreamRef = useRef<MediaStream | null>(null)
  const useServerTranscriptionRef = useRef(false)
  useEffect(() => {
    disposedRef.current = false
    void getInterviewCapabilities().then((value) => {
      if (!disposedRef.current) {
        setCapabilities(value)
        if (!value.available) setAnalysisNotice('Optional analysis is unavailable. You can continue with typed answers.')
      }
    }).catch(() => setAnalysisNotice('Optional analysis is unavailable.'))
    return () => { disposedRef.current = true }
  }, [])
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const answerRef = useRef('')
  useEffect(() => {
    answerRef.current = answer
  }, [answer])

  // Lifecycle & UI states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ending, setEnding] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [error, setError] = useState(
    (location.state as { generationError?: string } | null)?.generationError || ''
  )
  const [showEndModal, setShowEndModal] = useState(false)
  const [deviceConsent, setDeviceConsent] = useState<'camera' | 'microphone' | null>(null)
  const [enablingDevice, setEnablingDevice] = useState(false)
  const [deviceConsentError, setDeviceConsentError] = useState('')
  const [showTextEditor, setShowTextEditor] = useState(false)

  // AI & Voice phase: 'idle' | 'speaking' | 'listening'
  const [aiPhase, setAiPhase] = useState<'idle' | 'speaking' | 'listening'>('idle')
  const aiPhaseRef = useRef<'idle' | 'speaking' | 'listening'>('idle')
  useEffect(() => {
    aiPhaseRef.current = aiPhase
  }, [aiPhase])

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const transcriptRef = useRef('')

  // Natural Neural Voice Selection
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!window.speechSynthesis) return
    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
      setAvailableVoices(list)
      if (!selectedVoice && list.length) {
        const preferred =
          list.find((v) => /Jenny|Aria|Ava|Zira|Samantha|Hazel|Susan|Sonia|Female/i.test(v.name)) ||
          list.find((v) => v.name.includes('Natural') || v.name.includes('Online')) ||
          list.find((v) => v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Aria')) ||
          list.find((v) => v.name.includes('Samantha') || v.name.includes('Ava')) ||
          list[0]
        setSelectedVoice(preferred)
      }
    }
    updateVoices()
    window.speechSynthesis.onvoiceschanged = updateVoices
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoice])

  // Media & Hardware states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const isMicMutedRef = useRef(false)
  useEffect(() => {
    isMicMutedRef.current = isMicMuted
  }, [isMicMuted])

  const [cameraPermission, setCameraPermission] = useState<
    'unknown' | 'granted' | 'denied' | 'loading'
  >('unknown')

  // Real-time analysis and proctoring
  const [faceRegistered, setFaceRegistered] = useState(false)
  const faceRegisteredRef = useRef(false)
  useEffect(() => {
    faceRegisteredRef.current = faceRegistered
  }, [faceRegistered])

  const [proctorStatus, setProctorStatus] = useState<string>('Not verified')
  const [facialEmotion, setFacialEmotion] = useState<{ emotion?: string; confidence?: number } | null>(null)
  const [voiceEmotion, setVoiceEmotion] = useState<{ emotion?: string; confidence?: number } | null>(null)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(Date.now())

  // Hardware references
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingStartingRef = useRef(false)

  // AudioContext VAD (Voice Activity Detection for Barge-in Interruption)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const vadIntervalRef = useRef<number | null>(null)
  const aiSpeakingStartRef = useRef<number>(0)
  const consecutiveSpeechFramesRef = useRef<number>(0)

  // Interruption Sensitivity: 'smart' (calibrated VAD) | 'tap' (tap-only for loud rooms)
  const [interruptionMode] = useState<'smart' | 'tap'>('smart')
  const interruptionModeRef = useRef<'smart' | 'tap'>('smart')
  useEffect(() => {
    interruptionModeRef.current = interruptionMode
  }, [interruptionMode])

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Active call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-generate questions helper
  const loadVersionRef = useRef(0)
  const triggerQuestionGeneration = useCallback(async (targetId: string) => {
    setGeneratingQuestions(true)
    setError('')
    try {
      const { session: updated } = await generateInterviewQuestions(targetId)
      setSession(updated)
      const q = updated.questions || []
      setQuestions(q)
      if (q.length > 0) {
        setAnswer(q[0].answerText || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate questions. Please retry.')
    } finally {
      setGeneratingQuestions(false)
    }
  }, [])

  // Load session data
  const load = useCallback(async () => {
    const version = ++loadVersionRef.current
    setLoading(true)
    try {
      const { session: current } = await getInterview(id)
      if (version !== loadVersionRef.current) return
      setSession(current)
      const q = current.questions || []
      setQuestions(q)
      startTimeRef.current = new Date(current.startedAt).getTime()
      if (!current.microphoneEnabled) { setIsMicMuted(true); isMicMutedRef.current = true; setShowTextEditor(true) }
      if (current.status === 'abandoned') { navigate('/interview', { replace: true }); return }
      if (current.status === 'completed') {
        navigate(`/interview/results/${id}`, { replace: true })
        return
      }
      if (q.length === 0 && current.status === 'in_progress') {
        void triggerQuestionGeneration(id)
      } else if (q.length > 0) {
        const unanswered = q.findIndex((question) => !question.answerText?.trim())
        const resumeIndex = unanswered < 0 ? q.length - 1 : unanswered
        setCurrentIndex(resumeIndex)
        setAnswer(q[resumeIndex].answerText || '')
      }
    } catch (err) {
      if (version !== loadVersionRef.current) return
      setError(err instanceof Error ? err.message : 'Could not load this interview session')
    } finally {
      if (version === loadVersionRef.current) setLoading(false)
    }
  }, [id, navigate, triggerQuestionGeneration])

  useEffect(() => {
    void load()
    return () => { loadVersionRef.current += 1 }
  }, [load])

  // Camera Management
  const startCamera = useCallback(async () => {
    if (!sessionRef.current?.cameraEnabled || sessionRef.current.status !== 'in_progress' || disposedRef.current) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermission('denied')
      return
    }
    setCameraPermission('loading')
    try {
      let stream: MediaStream
      try {
        stream = takeDevice('camera') || await navigator.mediaDevices.getUserMedia({video: {width: {ideal: 1280}, height: {ideal: 720}, facingMode: 'user'}, audio: false})
      } catch (err) {
        if (!(err instanceof DOMException) || !['NotReadableError', 'AbortError', 'OverconstrainedError'].includes(err.name)) throw err
        // Some devices need a moment to release the preflight capture handle.
        await new Promise(resolve => setTimeout(resolve, 400))
        if (disposedRef.current) return
        stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
      }
      if (disposedRef.current || !sessionRef.current?.cameraEnabled) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {setIsCameraActive(false); setCameraPermission('denied'); void saveProctorEvent(id, 'camera_unavailable').catch(() => undefined)}, {once: true}))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          // ignore play interruption
        }
      }
      setIsCameraActive(true)
      setCameraPermission('granted')
    } catch (camErr) {
      console.warn('Camera stream error:', camErr)
      setCameraPermission('denied')
      setIsCameraActive(false)
      void saveProctorEvent(id, 'camera_unavailable').catch(() => undefined)
    }
  }, [id, takeDevice])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  useEffect(() => {
    if (!session?.cameraEnabled || session.status !== 'in_progress') return
    void startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera, session?.cameraEnabled, session?.status])

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      void videoRef.current.play().catch(() => undefined)
    }
  }, [isCameraActive, cameraPermission])

  const cameraAnalysisBusy = useRef(false)
  const [cameraAnalysisRunning,setCameraAnalysisRunning] = useState(false)
  // Facial Emotion & Face Verification loop
  const analyzeCameraFrame = useCallback(async () => {
    const video = videoRef.current
    if (cameraAnalysisBusy.current || disposedRef.current || sessionRef.current?.status !== 'in_progress' || !video || video.readyState < 2 || video.videoWidth === 0 || !isCameraActive) return
    cameraAnalysisBusy.current = true
    setCameraAnalysisRunning(true)
    try {
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(video.videoWidth, 640)
    canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const frameBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    )
    if (!frameBlob) return

    // Registration must not wait behind a potentially cold emotion model.
    const verify = async () => {
      if (!capabilities) {setProctorStatus('Checking identity service…'); return}
      if (!capabilities.proctoring) {setProctorStatus('Identity verification unavailable · service needs session isolation'); return}
      setProctorStatus(faceRegisteredRef.current ? 'Checking identity…' : 'Registering your face…')
      try {
        const registering = !faceRegisteredRef.current
        const {result} = await analyzeInterviewMedia(id, registering ? 'face-register' : 'face-verify', frameBlob, 'frame.jpg')
        if (disposedRef.current) return
        const labels: Record<string,string> = {VERIFIED: registering ? 'Face baseline registered' : 'Identity matched', NO_FACE:'No face detected · Face the camera in good light', MULTIPLE_FACES:'Multiple faces detected · Only one person should be visible', UNAUTHORIZED_FACE:'Candidate mismatch · Face the camera directly'}
        if (result.status === 'VERIFIED' && registering) {faceRegisteredRef.current = true; setFaceRegistered(true)}
        setProctorStatus(labels[String(result.status)] || 'Verification unavailable · Retry shortly')
      } catch {if (!disposedRef.current) setProctorStatus('Verification temporarily unavailable · Retrying automatically')}
    }
    const emotion = async () => {
      if (!capabilities?.face) return
      try {
        const {result} = await analyzeInterviewMedia(id,'face',frameBlob,'face.jpg')
        if (!disposedRef.current && result.emotion) setFacialEmotion({emotion:String(result.emotion),confidence:typeof result.confidence === 'number' ? result.confidence : undefined})
      } catch { /* Optional emotion inference does not delay identity registration. */ }
    }
    await Promise.allSettled([verify(),emotion()])
    } finally {cameraAnalysisBusy.current = false; if (!disposedRef.current) setCameraAnalysisRunning(false)}
  }, [id,isCameraActive,capabilities])

  useEffect(() => {
    if (!isCameraActive || cameraPermission !== 'granted') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const next = async () => {
      await analyzeCameraFrame()
      if (!cancelled) timer = setTimeout(() => void next(),15000)
    }
    timer = setTimeout(() => void next(),1500)
    return () => {cancelled = true; clearTimeout(timer)}
  }, [analyzeCameraFrame,isCameraActive,cameraPermission])

  // Audio chunk recording for ML voice emotion with Calibrated Web Audio VAD
  const startVoiceRecording = useCallback(async () => {
    if (monitoringBlockedRef.current || !sessionRef.current?.microphoneEnabled || captureSuspendedRef.current || disposedRef.current || !navigator.mediaDevices?.getUserMedia || isMicMutedRef.current || recordingStartingRef.current) return
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'paused' && aiPhaseRef.current !== 'speaking') mediaRecorderRef.current.resume()
      if (mediaRecorderRef.current.state !== 'inactive') return
    }

    recordingStartingRef.current = true
    try {
      await recordingDoneRef.current
      if (disposedRef.current || isMicMutedRef.current) return
      // Enable hardware echo cancellation, noise suppression, and auto gain control
      const stream = takeDevice('microphone') || await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      if (disposedRef.current || isMicMutedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      if (monitoringBlockedRef.current) {stream.getTracks().forEach(track => track.stop()); return}
      audioStreamRef.current = stream
      setMicrophoneReady(true)
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => setMicrophoneReady(false), {once: true}))

      // Setup Web Audio VAD with bandpass filter isolating human speech (300Hz - 3400Hz)
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioCtx()
        const source = audioCtx.createMediaStreamSource(stream)

        // Bandpass filter centered at 1400Hz to eliminate fan rumble and high-frequency hiss
        const filter = audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 1400
        filter.Q.value = 1.0

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(filter)
        filter.connect(analyser)

        audioContextRef.current = audioCtx
        analyserRef.current = analyser

        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current)
        vadIntervalRef.current = window.setInterval(() => {
          // Only evaluate VAD when AI is actively speaking and smart interruption is enabled
          if (
            aiPhaseRef.current === 'speaking' &&
            analyserRef.current &&
            !isMicMutedRef.current &&
            interruptionModeRef.current === 'smart'
          ) {
            const now = Date.now()
            // 2.5 second initial grace period: AI is never interrupted during intro or question start
            if (now - aiSpeakingStartRef.current < 2500) {
              consecutiveSpeechFramesRef.current = 0
              return
            }

            const buffer = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteFrequencyData(buffer)
            let sum = 0
            for (let i = 0; i < buffer.length; i += 1) sum += buffer[i]
            const average = sum / buffer.length

            // Human vocal energy threshold (60/255) ensures only deliberate speaking interrupts, ignoring fan noise
            if (average > 60) {
              consecutiveSpeechFramesRef.current += 1
              // Must sustain speech for at least 4 consecutive checks (~320ms)
              if (consecutiveSpeechFramesRef.current >= 4) {
                consecutiveSpeechFramesRef.current = 0
                if (window.speechSynthesis) window.speechSynthesis.cancel()
                aiPhaseRef.current = 'listening'
                setAiPhase('listening')
                startListeningRef.current()
              }
            } else {
              consecutiveSpeechFramesRef.current = Math.max(0, consecutiveSpeechFramesRef.current - 1)
            }
          } else {
            consecutiveSpeechFramesRef.current = 0
          }
        }, 80)
      } catch {
        // VAD fallback
      }

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data)
      }

      let recordingFinished: () => void
      recordingDoneRef.current = new Promise<void>((resolve) => { recordingFinished = resolve })
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
        if (audioContextRef.current) { void audioContextRef.current.close().catch(() => undefined); audioContextRef.current = null }
        if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null }
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' })
        try {
          if (!disposedRef.current && audioBlob.size > 0) {
            if (useServerTranscriptionRef.current) {
              try {
                const { result } = await analyzeInterviewMedia(id, 'transcribe', audioBlob, 'answer.webm')
                if (typeof result.text === 'string' && result.text.trim()) {
                  const text = [answerRef.current.trim(), result.text.trim()].filter(Boolean).join(' ')
                  answerRef.current = text
                  transcriptRef.current = text
                  setAnswer(text); setTranscript(text)
                }
              } catch { setAnalysisNotice('Speech transcription is unavailable. Type or edit your answer before continuing.'); setShowTextEditor(true) }
            }
            if (capabilities?.voice) {
              try {
                const { result } = await analyzeInterviewMedia(id, 'voice', audioBlob, 'answer.webm')
                if (typeof result.emotion === 'string') setVoiceEmotion({ emotion: result.emotion, confidence: typeof result.confidence === 'number' ? result.confidence : undefined })
              } catch { setVoiceEmotion(null) }
            }
          }
        } finally { recordingFinished() }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      if (aiPhaseRef.current === 'speaking') recorder.pause()
    } catch (recErr) {
      setMicrophoneReady(false)
      console.warn('Voice recording error:', recErr)
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      setShowTextEditor(true)
      setAnalysisNotice('Microphone access is unavailable. You can type your answer.')
    } finally { recordingStartingRef.current = false }
  }, [id, capabilities, takeDevice])

  const stopVoiceRecording = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current)
      vadIntervalRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    return recordingDoneRef.current
  }, [])

  // Interruption helper
  const interruptAi = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    aiPhaseRef.current = 'listening'
    setAiPhase('listening')
    startListeningRef.current()
  }, [])

  // Speech Recognition (Speech-to-Text)
  const startListening = useCallback(() => {
    if (disposedRef.current || captureSuspendedRef.current || monitoringBlockedRef.current) return
    if (isMicMutedRef.current || !sessionRef.current?.microphoneEnabled) {
      setShowTextEditor(true)
      setAiPhase('listening')
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI || useServerTranscriptionRef.current) {
      useServerTranscriptionRef.current = true
      setAiPhase('listening')
      setShowTextEditor(true)
      void startVoiceRecording()
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      // NEVER transcribe or self-interrupt while AI is speaking (avoids speaker echo)
      if (aiPhaseRef.current === 'speaking') {
        return
      }

      let finalStr = transcriptRef.current
      let interimStr = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i]
        const text = res[0].transcript
        if (res.isFinal) {
          finalStr += (finalStr ? ' ' : '') + text
        } else {
          interimStr += text
        }
      }

      transcriptRef.current = finalStr
      setTranscript(finalStr)
      setInterimTranscript(interimStr)

      const fullLive = `${finalStr}${interimStr ? ' ' + interimStr : ''}`.trim()
      setAnswer(fullLive)
    }

    recognition.onerror = () => {
      useServerTranscriptionRef.current = true
      recognitionRef.current = null
      setInterimTranscript('')
      setShowTextEditor(true)
      setAnalysisNotice('Live browser transcription is unavailable. Your recording can be transcribed when you continue, or you can type.')
    }

    recognition.onend = () => {
      setInterimTranscript('')
      // Auto-restart recognition if not muted and interview in progress
      if (!disposedRef.current && aiPhaseRef.current !== 'speaking' && !isMicMutedRef.current && recognitionRef.current === recognition) {
        try {
          recognitionRef.current.start()
        } catch {
          // ignore
        }
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      void startVoiceRecording()
    } catch {
      // ignore
    }
  }, [startVoiceRecording])

  const startListeningRef = useRef(startListening)
  startListeningRef.current = startListening

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    setInterimTranscript('')
    return stopVoiceRecording()
  }, [stopVoiceRecording])

  // Text-To-Speech (AI Speaking with Natural Voice Selection)
  const speakQuestion = useCallback(
    (textToSpeak: string) => {
      if (monitoringBlockedRef.current) return
      if (!window.speechSynthesis) {
        aiPhaseRef.current = 'listening'
        setAiPhase('listening')
        startListening()
        return
      }

      window.speechSynthesis.cancel()
      aiPhaseRef.current = 'speaking'
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.pause()
      // Stop speech recognition while AI is speaking so it doesn't transcribe the AI's own voice
      if (recognitionRef.current) {
        try {
          const recognition = recognitionRef.current
          recognitionRef.current = null
          recognition.abort()
        } catch {
          // ignore
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'en-US'
      utterance.rate = 0.96
      utterance.pitch = 1.0

      if (selectedVoice) {
        utterance.voice = selectedVoice
      } else {
        const voices = window.speechSynthesis.getVoices()
        const naturalVoice =
          voices.find(v => v.lang.startsWith('en') && /Jenny|Aria|Ava|Zira|Samantha|Hazel|Susan|Sonia|Female/i.test(v.name)) || voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Online') ||
                v.name.includes('Google') ||
                v.name.includes('Jenny') ||
                v.name.includes('Guy') ||
                v.name.includes('Samantha'))
          ) || voices.find((v) => v.lang.startsWith('en'))
        if (naturalVoice) utterance.voice = naturalVoice
      }

      aiSpeakingStartRef.current = Date.now()
      consecutiveSpeechFramesRef.current = 0

      // Keep-alive timer for Chrome SpeechSynthesis (prevents pauses on long questions)
      const keepAlive = window.setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        } else {
          clearInterval(keepAlive)
        }
      }, 5000)

      utterance.onstart = () => {
        aiPhaseRef.current = 'speaking'
        setAiPhase('speaking')
        aiSpeakingStartRef.current = Date.now()
        consecutiveSpeechFramesRef.current = 0
        void startVoiceRecording()
      }

      utterance.onend = () => {
        clearInterval(keepAlive)
        aiPhaseRef.current = 'listening'
        setAiPhase('listening')
        startListening()
      }

      utterance.onerror = () => {
        clearInterval(keepAlive)
        aiPhaseRef.current = 'listening'
        setAiPhase('listening')
        startListening()
      }

      window.speechSynthesis.speak(utterance)
    },
    [selectedVoice, startListening, startVoiceRecording]
  )

  // A voice-list refresh must not reset an answer or repeat the active question.
  const speakQuestionRef = useRef(speakQuestion)
  speakQuestionRef.current = speakQuestion
  const pendingSpeechRef = useRef('')

  // Trigger TTS whenever a new question is activated with conversational bridging
  const introducing = !!session?.introductionRequired && !session.introductionCompletedAt
  const currentQuestion: InterviewQuestion | undefined = introducing ? {
    id: `introduction-${id}`, questionText: 'Hi, I’m Maya, your CareerHub interviewer. We’ll start with a brief introduction, then work through your interview questions. You can speak naturally, interrupt me, or type your answers. To begin, could you introduce yourself in about 45 to 60 seconds? Tell me about your background, a recent project, and what you’d like to do next.',
    questionIndex: -1, category: 'Introductions', topic: 'Getting to know you', answerText: session?.candidateIntroduction || null, answeredAt: null,
  } : questions[currentIndex]

  // The activation key, not refreshed session/voice metadata, owns draft initialization.
  const activationRef = useRef({question: currentQuestion, prefix: ''})
  activationRef.current = {question: currentQuestion, prefix: introducing ? '' : currentIndex === 0
    ? session?.introductionCompletedAt ? "Thank you for that introduction. Let's start with your first question: " : "Welcome to your interview. Let's start with your first question: "
    : `Thank you for your answer. Let's move on to question ${currentIndex + 1}: `}
  useEffect(() => {
    const {question, prefix} = activationRef.current
    if (loading || !question?.questionText) return
    captureSuspendedRef.current = false
    const existingAnswer = question.answerText || ''
    setAnswer(existingAnswer)
    transcriptRef.current = existingAnswer
    setTranscript(existingAnswer)
    setInterimTranscript('')
    const timer = setTimeout(() => {
      const text = `${prefix}${question.questionText}`
      if (monitoringBlockedRef.current) pendingSpeechRef.current = text
      else {pendingSpeechRef.current = ''; speakQuestionRef.current(text)}
    }, 450)
    return () => {clearTimeout(timer); window.speechSynthesis?.cancel()}
  }, [currentQuestion?.id, loading])

  useEffect(() => {
    if (!monitoringBlockedRef.current && pendingSpeechRef.current) {
      const text = pendingSpeechRef.current; pendingSpeechRef.current = ''; speakQuestionRef.current(text)
    }
  }, [media.sharing, monitoringReady])

  useEffect(() => {
    if (!monitoringBlockedRef.current) return
    window.speechSynthesis?.cancel()
    aiPhaseRef.current = 'idle'; setAiPhase('idle')
    void stopListening()
  }, [media.sharing, monitoringReady, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      disposedRef.current = true
      void stopListening()
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      stopCamera()
    }
  }, [stopCamera, stopListening])

  // Advance to next question or complete interview
  const handleNextOrFinish = async () => {
    if (!currentQuestion || saving || ending) return
    if (monitoringBlockedRef.current || session?.monitoringMode === 'proctored' && (!isCameraActive || isMicMuted || !microphoneReady)) {setError('Restore your camera, microphone and entire-screen sharing before continuing.'); return}
    captureSuspendedRef.current = true
    setSaving(true)
    setError('')

    try {
      // 1. Stop current speech capture
      await stopListening()
      window.speechSynthesis?.cancel()

      // 2. Persist answer to backend
      const submittedAnswer = answerRef.current.trim()
      if (!submittedAnswer) { setShowTextEditor(true); throw new Error('Speak or type an answer before continuing.') }
      if (introducing) {
        const {session: updatedSession} = await saveInterviewIntroduction(id, submittedAnswer)
        setSession(updatedSession); setCurrentIndex(0); return
      }
      const { question: savedQ } = await saveInterviewAnswer(currentQuestion.id, submittedAnswer)

      const updated = questions.map((item, idx) => (idx === currentIndex ? savedQ : item))
      setQuestions(updated)
      try {
        const { session: latest } = await getInterview(id)
        const signals = latest.emotionResults || []
        const body = Object.fromEntries(['face', 'voice', 'text'].map((modality) => {
          const output = signals.filter((item) => item.modality === modality && item.result.source === 'ml').at(-1)?.result
          return [modality, output?.predictions || null]
        }))
        if (Object.values(body).some(Boolean)) {
          const { result } = await analyzeInterviewMedia(id, 'fusion', body)
          if (typeof result.dominant_emotion === 'string') setFusionEmotion(result.dominant_emotion)
        }
      } catch { /* Missing optional fusion does not prevent completing an interview. */ }

      // 3. If there are more questions, advance index
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Last question reached -> Evaluate interview!
        setEnding(true)
        stopCamera()
        const { session: evaluated } = await evaluateInterview(id)
        setSession(evaluated)
        navigate(`/interview/results/${id}`, { replace: true })
      }
    } catch (saveErr) {
      setError(saveErr instanceof Error ? saveErr.message : 'Could not save your answer.')
    } finally {
      setSaving(false)
      setEnding(false)
      captureSuspendedRef.current = false
    }
  }

  // Early leave handler
  const handleEndCallNow = async () => {
    captureSuspendedRef.current = true
    setEnding(true)
    setShowEndModal(false)
    window.speechSynthesis?.cancel()
    try {
      await stopListening()
      if (currentQuestion && answerRef.current.trim() && !monitoringBlockedRef.current) {
        if (introducing) await saveInterviewIntroduction(id, answerRef.current.trim())
        else await saveInterviewAnswer(currentQuestion.id, answerRef.current.trim())
      }
      const { session: latest } = await getInterview(id)
      if (latest.questions?.some((question) => question.answerText?.trim())) {
        await evaluateInterview(id)
        stopCamera()
        navigate('/interview/results/' + id, { replace: true })
      } else {
        await api('/interview/sessions/' + id, { method: 'PATCH', body: { status: 'abandoned' } })
        stopCamera()
        navigate('/interview', { replace: true })
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not end interview. Please retry.') }
    finally { setEnding(false); captureSuspendedRef.current = false }
  }

  // Toggle Microphone
  const toggleMic = () => {
    if (!session?.microphoneEnabled) { setDeviceConsentError(''); setDeviceConsent('microphone'); return }
    if (isMicMuted) {
      isMicMutedRef.current = false
      setIsMicMuted(false)
      startListening()
    } else {
      isMicMutedRef.current = true
      setIsMicMuted(true)
      void stopListening()
    }
  }

  // Toggle Camera
  const toggleCamera = () => {
    if (!session?.cameraEnabled) { setDeviceConsentError(''); setDeviceConsent('camera'); return }
    if (isCameraActive) {
      void saveProctorEvent(id, 'camera_off').catch(() => undefined)
      setProctorStatus('Camera off')
      stopCamera()
    } else {
      void startCamera()
    }
  }

  const enableConsentedDevice = async () => {
    if (!deviceConsent || enablingDevice) return
    const device = deviceConsent
    setEnablingDevice(true)
    setDeviceConsentError('')
    try {
      const { session: updated } = await grantInterviewDeviceConsent(id, device)
      sessionRef.current = updated
      setSession(updated)
      setDeviceConsent(null)
      if (device === 'microphone') {
        isMicMutedRef.current = false
        setIsMicMuted(false)
        startListening()
      }
      // Camera starts through the consent-dependent effect after the UI updates.
    } catch (err) {
      setDeviceConsentError(err instanceof Error ? err.message : 'Could not enable the device. Please retry.')
    } finally { setEnablingDevice(false) }
  }

  useEffect(() => {
    if (!session?.cameraEnabled || session.status !== 'in_progress' || session.monitoringMode === 'proctored') return
    let lastEventAt = 0
    const onVisibility = () => {
      if (!document.hidden || Date.now() - lastEventAt < 5000) return
      lastEventAt = Date.now()
      void saveProctorEvent(id, 'tab_hidden').catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [id, session?.cameraEnabled, session?.monitoringMode, session?.status])

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Connecting to your interview room...</h2>
          <p className="mt-1 text-sm text-muted-foreground">Setting up audio, video stream, and AI interviewer.</p>
        </div>
      </div>
    )
  }

  // Session Not Found Screen
  if (!session) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto size-10 text-destructive" />
        <h2 className="mt-4 text-lg font-bold text-card-foreground">Interview Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'This interview room could not be loaded.'}</p>
        <Link
          to="/interview"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          Return to Interviews
        </Link>
      </div>
    )
  }

  // Empty Questions / Question Generator Screen
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-7 animate-pulse" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-card-foreground">Preparing your interview questions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The AI interviewer is tailoring questions for {session.role || 'your role'} based on your selected topics.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void triggerQuestionGeneration(id)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Retry Question Generation
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={generatingQuestions}
            onClick={() => void triggerQuestionGeneration(id)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
          >
            {generatingQuestions ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Generating Questions...
              </>
            ) : (
              <>Start Generation Now</>
            )}
          </button>
        )}
      </div>
    )
  }

  const isLastQuestion = !introducing && currentIndex === questions.length - 1
  const progressPercent = introducing ? 0 : Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 pb-12 select-none">
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error} Your saved answers are retained; you can retry.</div>}
      <InterviewIncidents session={session} />
      <InterviewMonitoring id={id} active={session.monitoringMode === 'proctored' && session.status === 'in_progress'} onReady={setMonitoringReady} onResume={() => speakQuestion(currentQuestion.questionText)} />
      {session.monitoringMode === 'proctored' && (!isCameraActive || isMicMuted || !microphoneReady) && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">Proctored mode requires your camera and microphone. Turn them on below; after sharing, select Replay & resume to start audio capture.</p>}
      {/* Top Video Call Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Active Call
            </span>
          </div>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm font-semibold text-card-foreground">
            {session.role || 'AI Mock Interview'}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ({session.topics.slice(0, 2).join(', ')})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Call Elapsed Timer */}
          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 font-mono text-xs font-medium text-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{formatTime(elapsed)}</span>
          </div>

          {/* Voice Selector */}
          {availableVoices.length > 1 && (
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const found = availableVoices.find((v) => v.name === e.target.value)
                if (found) setSelectedVoice(found)
              }}
              className="hidden rounded-lg border border-border bg-muted/60 px-2 py-1 text-xs font-medium text-foreground outline-none sm:inline-block max-w-[140px] truncate"
              title="Choose AI Interviewer Voice"
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name.replace(/Microsoft |Google |\(.*\)/g, '').trim()}
                </option>
              ))}
            </select>
          )}

          {/* Question Index Pill */}
          <div className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {introducing ? 'Brief introduction' : `Question ${currentIndex + 1} of ${questions.length}`}
          </div>

          {/* End Call Button */}
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            disabled={ending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
          >
            <PhoneOff className="size-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Prominent Question Banner Overlay */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span>{currentQuestion.category || currentQuestion.questionType || 'Question'}</span>
            {currentQuestion.topic && (
              <>
                <span>·</span>
                <span>{currentQuestion.topic}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Barge-in Interruption Indicator / Button */}
            {aiPhase === 'speaking' && (
              <button
                type="button"
                onClick={interruptAi}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/30 dark:text-amber-400"
                title="Interrupt AI speaking immediately"
              >
                <Hand className="size-3.5 animate-pulse" />
                <span>Interrupt AI (or just speak)</span>
              </button>
            )}

            {/* Replay Question TTS Audio Button */}
            <button
              type="button"
              onClick={() => speakQuestion(currentQuestion.questionText)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/25"
              title="Listen to question again"
            >
              <Volume2 className="size-3.5" />
              <span>Replay audio</span>
            </button>
          </div>
        </div>

        <h1 className="mt-2 text-lg font-semibold leading-relaxed text-card-foreground sm:text-xl">
          {currentQuestion.questionText}
        </h1>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Dual Video Call Screen Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Video Tile: AI Interviewer (Clicking allows instant interruption) */}
        <div
          onClick={aiPhase === 'speaking' ? interruptAi : undefined}
          className={`relative aspect-video min-h-[300px] overflow-hidden rounded-3xl border border-border bg-zinc-950 shadow-md ${
            aiPhase === 'speaking' ? 'cursor-pointer' : ''
          }`}
          title={aiPhase === 'speaking' ? 'Click to interrupt AI' : undefined}
        >
          <AIInterviewerAvatar
            state={aiPhase}
            name="AI Interviewer"
            voiceName={selectedVoice ? selectedVoice.name.replace(/Microsoft |Google |\(.*\)/g, '').trim() : undefined}
          />
          {aiPhase === 'speaking' && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-md">
              <Hand className="size-3" />
              <span>Click or speak to interrupt</span>
            </div>
          )}
        </div>

        {/* Right Video Tile: Candidate (You) */}
        <div className="relative aspect-video min-h-[300px] overflow-hidden rounded-3xl border border-border bg-zinc-950 shadow-md">
          {isCameraActive && cameraPermission === 'granted' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full object-cover -scale-x-100"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 bg-zinc-900 p-6 text-center text-white">
              <div className="flex size-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <CameraOff className="size-7" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                {cameraPermission === 'denied'
                  ? 'Camera permission denied'
                  : cameraPermission === 'loading'
                  ? 'Accessing camera...'
                  : 'Camera is currently turned off'}
              </p>
              <button
                type="button"
                onClick={toggleCamera}
                disabled={enablingDevice || saving || ending}
                className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:opacity-90"
              >
                <Camera className="size-3.5" />
                <span>Turn Camera On</span>
              </button>
            </div>
          )}

          {/* Top Overlays on Candidate Tile */}
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
            <span>You (Candidate)</span>
            {isMicMuted && <MicOff className="size-3 text-destructive" />}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Live Feed</span>
          </div>

          {/* Bottom Overlays on Candidate Tile: Proctoring & Facial Affect Signals */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{session.cameraEnabled ? proctorStatus : 'Camera off · enable when ready'}</span>{isCameraActive && capabilities?.proctoring && <button type="button" onClick={() => void analyzeCameraFrame()} disabled={cameraAnalysisRunning} className="ml-2 underline disabled:opacity-50">{cameraAnalysisRunning ? 'Check in progress…' : 'Retry check'}</button>}
            </div>

            {facialEmotion?.emotion && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <span className="text-muted-foreground">Face Affect:</span>
                <span className="font-semibold capitalize text-primary">
                  {facialEmotion.emotion}
                </span>
                {typeof facialEmotion.confidence === 'number' && (
                  <span className="text-white/60">
                    ({Math.round(facialEmotion.confidence * 100)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Voice Caption & Transcription Banner */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-6 items-center justify-center rounded-full ${
                aiPhase === 'speaking'
                  ? 'bg-primary/10 text-primary'
                  : !isMicMuted
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {aiPhase === 'speaking' ? (
                <Volume2 className="size-3.5 animate-pulse" />
              ) : (
                <Mic className="size-3.5" />
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {aiPhase === 'speaking'
                ? 'AI Interviewer speaking (speak or click to interrupt)...'
                : !isMicMuted
                ? 'Candidate Voice Transcript (Live)'
                : 'Microphone Muted'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {voiceEmotion?.emotion && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary capitalize">
                Voice Tone: {voiceEmotion.emotion}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Edit3 className="size-3.5" />
              <span>{showTextEditor ? 'Hide text editor' : 'Edit answer / Type'}</span>
            </button>
          </div>
        </div>

        {/* Live speech captions */}
        <div className="mt-2.5 min-h-[52px] rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-card-foreground">
          {aiPhase === 'speaking' ? (
            <div className="flex items-center justify-between">
              <span className="italic text-muted-foreground">
                AI Interviewer is speaking. Start answering anytime — the AI will stop speaking when you talk.
              </span>
              <button
                type="button"
                onClick={interruptAi}
                className="text-xs font-semibold text-primary underline"
              >
                Interrupt now
              </button>
            </div>
          ) : transcript || interimTranscript ? (
            <>
              <span className="font-medium text-card-foreground">{transcript}</span>
              {interimTranscript && (
                <span className="italic text-muted-foreground"> {interimTranscript}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              {isMicMuted
                ? 'Microphone is muted. Unmute to speak your answer, or use the text editor.'
                : '🎙️ Speak your answer aloud anytime... your response will be transcribed hands-free.'}
            </span>
          )}
        </div>

        {/* Collapsible Answer Editor Drawer */}
        {analysisNotice && <p role="status" className="mt-3 text-sm text-muted-foreground">{analysisNotice}</p>}
        {fusionEmotion && <p className="mt-2 text-sm text-muted-foreground">Combined coaching signal: {fusionEmotion}</p>}
        {showTextEditor && (
          <div className="mt-3 border-t border-border pt-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Answer Editor (Review and edit your spoken answer before submitting):
              </span>
              <textarea
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value)
                  transcriptRef.current = e.target.value
                  setTranscript(e.target.value)
                }}
                rows={4}
                maxLength={introducing ? 4000 : 12000}
                placeholder="Type or refine your response here..."
                className="mt-1.5 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        )}
      </div>

      {/* Floating Bottom Video Call Controls Bar */}
      <div className="sticky bottom-4 z-30 mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl border border-border bg-card/95 px-5 py-3 shadow-xl backdrop-blur-lg">
        {/* Mic Control */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={enablingDevice || saving || ending}
          className={`flex size-11 items-center justify-center rounded-xl border transition-all ${
            isMicMuted
              ? 'border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25'
              : 'border-border bg-muted text-card-foreground hover:bg-muted/80'
          }`}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        {/* Camera Control */}
        <button
          type="button"
          onClick={toggleCamera}
          disabled={enablingDevice || saving || ending}
          className={`flex size-11 items-center justify-center rounded-xl border transition-all ${
            !isCameraActive
              ? 'border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25'
              : 'border-border bg-muted text-card-foreground hover:bg-muted/80'
          }`}
          title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
        >
          {!isCameraActive ? <CameraOff className="size-5" /> : <Camera className="size-5" />}
        </button>

        {/* Replay Question Button */}
        <button
          type="button"
          onClick={() => speakQuestion(currentQuestion.questionText)}
          className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-card-foreground hover:bg-muted/80"
          title="Repeat Question Aloud"
        >
          <Volume2 className="size-5" />
        </button>

        {/* Toggle Editor Drawer Button */}
        <button
          type="button"
          onClick={() => setShowTextEditor(!showTextEditor)}
          className={`flex size-11 items-center justify-center rounded-xl border transition-all ${
            showTextEditor
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted text-card-foreground hover:bg-muted/80'
          }`}
          title="Toggle Text Editor"
        >
          <Edit3 className="size-5" />
        </button>

        {/* Next Question / Finish Interview CTA */}
        <button
          type="button"
          disabled={saving || ending || session.monitoringMode === 'proctored' && (monitoringBlockedRef.current || !isCameraActive || isMicMuted || !microphoneReady)}
          onClick={() => void handleNextOrFinish()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving || ending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{ending ? 'Evaluating...' : 'Saving...'}</span>
            </>
          ) : isLastQuestion ? (
            <>
              <Check className="size-4" />
              <span>Finish Interview</span>
            </>
          ) : (
            <>
              <span>{introducing ? 'Begin Questions' : 'Next Question'}</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        {/* Leave Call End Button */}
        <button
          type="button"
          onClick={() => setShowEndModal(true)}
          disabled={ending}
          className="flex size-11 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow hover:opacity-90 disabled:opacity-50"
          title="End Interview Call"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>

      {deviceConsent && (
        <div role="dialog" aria-modal="true" aria-labelledby="device-consent-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 id="device-consent-title" className="text-lg font-bold">Enable {deviceConsent}?</h3>
            <p className="text-sm leading-6 text-muted-foreground">{deviceConsent === 'camera'
              ? 'This starts your camera preview. Frames are sent to the interview analysis service for optional camera coaching while the camera is on. You can turn it off at any time.'
              : 'This records your microphone and sends audio for transcription and optional voice coaching. You can mute at any time.'} Your browser may also ask for device permission.</p>
            {deviceConsentError && <p role="alert" className="text-sm text-destructive">{deviceConsentError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" disabled={enablingDevice} onClick={() => setDeviceConsent(null)} className="rounded-xl border border-border px-4 py-2">Cancel</button>
              <button type="button" disabled={enablingDevice} onClick={() => void enableConsentedDevice()} className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">{enablingDevice ? 'Enabling...' : `Enable ${deviceConsent}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Ending Call */}
      {showEndModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="end-interview-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="end-interview-title" className="text-lg font-bold text-card-foreground">Leave Interview Call?</h3>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                aria-label="Close end interview dialog"
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your saved answers will be evaluated when you end the call. If you have not answered any questions, the interview will end without an evaluation.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-card-foreground hover:bg-muted"
              >
                Continue Call
              </button>
              <button
                type="button"
                disabled={ending}
                onClick={() => void handleEndCallNow()}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {ending ? <Loader2 className="size-4 animate-spin" /> : <PhoneOff className="size-4" />}
                <span>End interview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
