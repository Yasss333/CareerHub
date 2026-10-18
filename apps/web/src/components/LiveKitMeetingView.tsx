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
        // LiveKit is not configured; fallback immediately to direct video call
        onSwitchToJitsi()
        return
      } else {
        setTokenData(data)
      }
    } catch (err: any) {
      console.warn('LiveKit meeting token fetch failed, switching directly to Jitsi:', err)
      onSwitchToJitsi()
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
        <h4 className="text-lg font-semibold text-gray-200">Connecting to Video Session...</h4>
        <p className="text-sm text-gray-400 max-w-md text-center mt-2">
          Setting up encrypted media room for you and <strong className="text-gray-300">{peerName}</strong>.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Initializing media channels...
        </div>
      </div>
    )
  }

  if (error || !tokenData?.token || !tokenData.serverUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-white p-6 min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <h4 className="text-lg font-semibold text-gray-200">Connecting to Video Call...</h4>
        <p className="text-sm text-gray-400 max-w-md text-center mt-2">
          Directing you straight into the video call room.
        </p>
        <button
          onClick={onSwitchToJitsi}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
        >
          <ExternalLink className="w-4 h-4" /> Start Video Call Now
        </button>
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
