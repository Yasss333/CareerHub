import {createContext, useContext} from 'react'
export type Device = 'camera' | 'microphone'
type MediaState = {
  screen: MediaStream | null
  sharing: boolean
  screenError: string
  startScreen: () => Promise<boolean>
  stopScreen: () => void
  stageDevice: (device: Device, stream: MediaStream) => void
  takeDevice: (device: Device) => MediaStream | null
}
export const InterviewMediaContext = createContext<MediaState | null>(null)
export function useInterviewMedia() {
  const context = useContext(InterviewMediaContext)
  if (!context) throw new Error('Interview media provider missing')
  return context
}
