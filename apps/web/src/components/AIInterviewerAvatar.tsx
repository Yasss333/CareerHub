import { Volume2, Mic, Bot, Sparkles, AudioWaveform } from 'lucide-react'

export interface AIInterviewerAvatarProps {
  state: 'idle' | 'speaking' | 'listening'
  className?: string
  name?: string
  voiceName?: string
}

export default function AIInterviewerAvatar({
  state,
  className = '',
  name = 'AI Interview Coach',
  voiceName,
}: AIInterviewerAvatarProps) {
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'

  return (
    <div
      className={`relative flex h-full min-h-[300px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 select-none ${className}`}
    >
      {/* Dynamic ambient background glow */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          isSpeaking
            ? 'opacity-40 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.35),transparent_70%)]'
            : isListening
            ? 'opacity-35 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.3),transparent_70%)]'
            : 'opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)]'
        }`}
      />

      {/* Top participant tag & voice indicator */}
      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
        <Bot className="size-3.5 text-primary" />
        <span>{name}</span>
        {voiceName && (
          <span className="hidden text-[10px] text-zinc-400 sm:inline">
            · {voiceName}
          </span>
        )}
      </div>

      {/* Concentric AI animated pulsating aura */}
      <div className="relative flex size-44 items-center justify-center sm:size-52">
        {/* Outer expanding ring */}
        <div
          className={`absolute inset-0 rounded-full border transition-all duration-700 ${
            isSpeaking
              ? 'animate-ping border-primary/40'
              : isListening
              ? 'border-emerald-400/25 ring-2 ring-emerald-500/15'
              : 'border-white/10'
          }`}
        />

        {/* Middle pulsing ring */}
        <div
          className={`absolute inset-3 rounded-full border transition-all duration-500 ${
            isSpeaking
              ? 'animate-pulse border-primary/60 bg-primary/10 shadow-[0_0_40px_rgba(99,102,241,0.35)]'
              : isListening
              ? 'animate-pulse border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        />

        {/* Inner ring */}
        <div
          className={`absolute inset-8 rounded-full border-2 transition-all duration-300 ${
            isSpeaking
              ? 'scale-105 border-primary bg-primary/20 shadow-[0_0_45px_rgba(99,102,241,0.5)]'
              : isListening
              ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
              : 'border-white/20 bg-white/[0.04]'
          }`}
        />

        {/* Central orb with fluid voice equalizer */}
        <div
          className={`relative z-10 flex size-24 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 sm:size-28 ${
            isSpeaking
              ? 'scale-110 border-primary/80 bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 text-white shadow-primary/50'
              : isListening
              ? 'scale-100 border-emerald-400/80 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-500/40'
              : 'border-white/20 bg-gradient-to-tr from-zinc-800 to-zinc-700 text-white/80'
          }`}
        >
          {isSpeaking ? (
            /* Multi-bar bouncing voice wave (Vapi / Siri style) */
            <div className="flex h-12 items-center gap-1">
              <span className="h-3 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '0ms' }} />
              <span className="h-6 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '120ms' }} />
              <span className="h-9 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '240ms' }} />
              <span className="h-11 w-1.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '360ms' }} />
              <span className="h-12 w-1.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '180ms' }} />
              <span className="h-10 w-1.5 animate-pulse rounded-full bg-white" style={{ animationDelay: '480ms' }} />
              <span className="h-8 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '300ms' }} />
              <span className="h-5 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '150ms' }} />
              <span className="h-2.5 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: '60ms' }} />
            </div>
          ) : isListening ? (
            <div className="flex flex-col items-center">
              <Mic className="size-8 animate-pulse text-white drop-shadow" />
            </div>
          ) : (
            <Sparkles className="size-8 text-white/80" />
          )}
        </div>
      </div>

      {/* Real-time status indicator pill */}
      <div className="relative z-10 mt-5 flex items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-md">
        {isSpeaking && (
          <>
            <AudioWaveform className="size-4 animate-bounce text-primary" />
            <span className="text-xs font-semibold tracking-wide text-white">
              AI Speaking...
            </span>
          </>
        )}

        {isListening && (
          <>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-emerald-300">
              Listening to your answer...
            </span>
          </>
        )}

        {state === 'idle' && (
          <span className="text-xs font-medium text-white/60">
            AI Interviewer Ready
          </span>
        )}
      </div>
    </div>
  )
}
