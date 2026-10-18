import { useState, useEffect } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer
} from '@livekit/components-react'
import '@livekit/components-styles'
import { AlertCircle, RefreshCw, Radio, ExternalLink } from 'lucide-react'

interface LiveKitMeetingViewProps {
  sessionId: string
  peerName: string
  peerRole: string
  fallbackJitsiUrl: string
  onSwitchToJitsi: () => void
}

interface TokenResponse {
  available: boolean
  provider: 'livekit' | 'jitsi'
  token?: string
  serverUrl?: string
  roomName?: string
  message?: string
  fallbackUrl?: string
}

export default function LiveKitMeetingView({
  sessionId,
  peerName,
  peerRole,
  fallbackJitsiUrl,
  onSwitchToJitsi
}: LiveKitMeetingViewProps) {
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const fetchToken = async () => {
    setLoading(true)
    setError(null)
    setConnectionError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${sessionId}/livekit-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with status ${response.status}`)
      }

      const data: TokenResponse = await response.json()
      if (!data.available || !data.token) {
        // LiveKit is not configured or server indicated fallback
        setTokenData(data)
        setError(data.message || 'LiveKit server is not configured. Jitsi fallback is ready.')
      } else {
        setTokenData(data)
      }
    } catch (err: any) {
      console.error('Failed to obtain LiveKit meeting token:', err)
      setError(err.message || 'Unable to connect to the video service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToken()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-white p-6 min-h-[400px]">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h4 className="text-lg font-semibold text-gray-200">Initializing In-House Video Session...</h4>
        <p className="text-sm text-gray-400 max-w-md text-center mt-2">
          Generating cryptographic room credentials for an encrypted session with <strong className="text-gray-300">{peerName}</strong>.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Connecting to LiveKit SFU media router...
        </div>
      </div>
    )
  }

  if (error || !tokenData?.token || !tokenData.serverUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-white p-6 min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-semibold text-gray-200">In-House Video Server Notice</h4>
        <p className="text-sm text-gray-400 max-w-md text-center mt-2">
          {error || 'The LiveKit SFU server is currently offline or unconfigured on this environment.'}
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 my-5 max-w-lg w-full text-xs text-gray-300 space-y-2">
          <div className="font-semibold text-gray-200 flex items-center gap-1.5">
            💡 To run LiveKit locally in-house with Docker:
          </div>
          <code className="block bg-black/60 p-2.5 rounded-lg text-emerald-400 font-mono select-all">
            docker compose up livekit -d
          </code>
          <p className="text-gray-400 text-[11px]">
            No third-party login or credit card required. LiveKit runs 100% locally on port 7880.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchToken}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg border border-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
          <button
            onClick={onSwitchToJitsi}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Continue with Jitsi Call
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full h-full relative bg-gray-950 text-white overflow-hidden flex flex-col">
      {connectionError && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Connection issue detected: {connectionError}</span>
          </div>
          <button
            onClick={onSwitchToJitsi}
            className="underline hover:text-white font-medium ml-2"
          >
            Switch to Jitsi Call
          </button>
        </div>
      )}

      <div className="flex-1 w-full h-full min-h-[450px]">
        <LiveKitRoom
          video={true}
          audio={true}
          token={tokenData.token}
          serverUrl={tokenData.serverUrl}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%' }}
          onError={(err) => {
            console.error('LiveKit room connection error:', err)
            setConnectionError(err.message || 'Media connection lost')
          }}
          onDisconnected={() => {
            console.log('User left or disconnected from LiveKit room')
          }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  )
}
