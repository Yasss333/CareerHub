import { useState } from 'react'
import { X, ExternalLink, Video, ShieldCheck, Maximize2, Server, Globe } from 'lucide-react'
import LiveKitMeetingView from './LiveKitMeetingView'

interface VideoMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  jitsiRoomUrl: string
  sessionTopic: string
  peerName: string
  peerRole: string
  onCompleteSession?: () => void
  isMentor?: boolean
  sessionId?: string
}

export default function VideoMeetingModal({
  isOpen,
  onClose,
  jitsiRoomUrl,
  sessionTopic,
  peerName,
  peerRole,
  onCompleteSession,
  isMentor,
  sessionId
}: VideoMeetingModalProps) {
  const [fullscreen, setFullscreen] = useState(false)
  // Default to in-house LiveKit if sessionId is available, else fallback to Jitsi
  const [videoProvider, setVideoProvider] = useState<'livekit' | 'jitsi'>(
    sessionId ? 'livekit' : 'jitsi'
  )

  if (!isOpen) return null

  // Ensure config params for Jitsi iframe embed
  const embedUrl = jitsiRoomUrl.includes('#')
    ? jitsiRoomUrl
    : `${jitsiRoomUrl}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div
        className={`bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
          fullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[88vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-gray-100">{sessionTopic}</h3>
                {videoProvider === 'livekit' ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Server className="w-3 h-3" /> In-House LiveKit SFU
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Jitsi Encrypted Call
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Meeting with <span className="text-gray-200 font-medium">{peerName}</span> ({peerRole})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Selector Toggle if sessionId is provided */}
            {sessionId && (
              <div className="hidden md:flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
                <button
                  type="button"
                  onClick={() => setVideoProvider('livekit')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    videoProvider === 'livekit'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  title="Use self-hosted LiveKit SFU"
                >
                  <Server className="w-3 h-3" /> In-House
                </button>
                <button
                  type="button"
                  onClick={() => setVideoProvider('jitsi')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    videoProvider === 'jitsi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  title="Use fallback Jitsi Meet"
                >
                  <Globe className="w-3 h-3" /> Jitsi
                </button>
              </div>
            )}

            {videoProvider === 'jitsi' && (
              <button
                onClick={() => window.open(jitsiRoomUrl, '_blank')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg transition-colors border border-gray-700"
                title="Open Jitsi call in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Tab
              </button>
            )}

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {isMentor && onCompleteSession && (
              <button
                onClick={() => {
                  if (window.confirm('Are you ready to mark this mentorship session as completed?')) {
                    onCompleteSession()
                    onClose()
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Complete Session
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Close Call Window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
          {videoProvider === 'livekit' && sessionId ? (
            <LiveKitMeetingView
              sessionId={sessionId}
              peerName={peerName}
              peerRole={peerRole}
              fallbackJitsiUrl={jitsiRoomUrl}
              onSwitchToJitsi={() => setVideoProvider('jitsi')}
            />
          ) : (
            <iframe
              src={embedUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className="w-full h-full border-0"
              title="Senior Connect Video Call"
            />
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span className="flex items-center gap-2">
            💡 If camera or microphone asks for permission, click <strong className="text-gray-200">Allow</strong> in your browser address bar.
          </span>
          <div className="flex items-center gap-3">
            {videoProvider === 'livekit' && sessionId ? (
              <button
                onClick={() => setVideoProvider('jitsi')}
                className="text-indigo-400 hover:text-indigo-300 hover:underline text-xs flex items-center gap-1"
              >
                Having issues? Switch to Jitsi Call
              </button>
            ) : (
              <button
                onClick={() => window.open(jitsiRoomUrl, '_blank')}
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                Having trouble? Open in new window <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
