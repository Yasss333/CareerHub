import {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {useLocation} from 'react-router-dom'
import {InterviewMediaContext as Context, type Device} from './useInterviewMedia'

export function InterviewMediaProvider({children}: {children: ReactNode}) {
  const {pathname} = useLocation()
  const ref = useRef<MediaStream | null>(null)
  const devices = useRef<Record<Device, MediaStream | null>>({camera: null, microphone: null})
  const stageDevice = useCallback((device: Device, stream: MediaStream) => {
    devices.current[device]?.getTracks().forEach(track => track.stop()); devices.current[device] = stream
  }, [])
  const takeDevice = useCallback((device: Device) => {
    const stream = devices.current[device]; devices.current[device] = null
    if (stream?.getTracks().some(track => track.readyState === 'live')) return stream
    stream?.getTracks().forEach(track => track.stop()); return null
  }, [])
  const stopStaged = useCallback(() => {
    for (const device of ['camera', 'microphone'] as const) {devices.current[device]?.getTracks().forEach(track => track.stop()); devices.current[device] = null}
  }, [])
  const mounted = useRef(true)
  const requesting = useRef(false)
  const allowed = useRef(false)
  allowed.current = pathname === '/interview/setup' || pathname.startsWith('/interview/session/')
  const [screen, setScreen] = useState<MediaStream | null>(null)
  const [screenError, setScreenError] = useState('')
  const stopScreen = useCallback(() => {
    ref.current?.getTracks().forEach(track => track.stop()); ref.current = null; setScreen(null)
  }, [])
  const startScreen = useCallback(async () => {
    if (requesting.current) return false
    if (!navigator.mediaDevices?.getDisplayMedia) {setScreenError('Entire-screen sharing needs a supported desktop browser on HTTPS or localhost. Use practice mode on this device.'); return false}
    requesting.current = true; setScreenError('')
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({video: {displaySurface: 'monitor'}, audio: false})
      if (!mounted.current || !allowed.current) {stream.getTracks().forEach(t => t.stop()); return false}
      const track = stream.getVideoTracks()[0]
      if (track?.getSettings().displaySurface !== 'monitor') {
        stream.getTracks().forEach(t => t.stop()); setScreenError('Choose “Entire screen” in the browser picker. A tab or window does not cover this interview.'); return false
      }
      stopScreen(); ref.current = stream; setScreen(stream)
      track.addEventListener('ended', () => {if (ref.current === stream) {ref.current = null; setScreen(null)}}, {once: true})
      return true
    } catch (err) {setScreenError(err instanceof DOMException && err.name === 'NotAllowedError' ? 'Screen sharing was cancelled or blocked. Try again and select an entire screen.' : 'Screen sharing could not start. Check browser and operating system permissions, then retry.'); return false}
    finally {requesting.current = false}
  }, [stopScreen])
  useEffect(() => {
    if (pathname !== '/interview/setup' && !pathname.startsWith('/interview/session/')) {stopScreen(); stopStaged()}
  }, [pathname, stopScreen, stopStaged])
  useEffect(() => {mounted.current = true; return () => {mounted.current = false; ref.current?.getTracks().forEach(t => t.stop()); stopStaged()}}, [stopStaged])
  return <Context.Provider value={{screen, sharing: !!screen?.getVideoTracks().some(t => t.readyState === 'live'), screenError, startScreen, stopScreen, stageDevice, takeDevice}}>{children}</Context.Provider>
}
