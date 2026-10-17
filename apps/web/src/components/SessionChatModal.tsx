import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageSquare, Loader2, Sparkles } from 'lucide-react'

interface Message {
  id: string
  sessionId: string
  senderId: string
  message: string
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string
    role: string
  }
}

interface SessionChatModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  sessionTopic: string
  peerName: string
  peerAvatar?: string
  peerRole: string
}

export default function SessionChatModal({
  isOpen,
  onClose,
  sessionId,
  sessionTopic,
  peerName,
  peerAvatar,
  peerRole
}: SessionChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load chat messages')
      const data = await response.json()
      setMessages(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetchMessages()

    // Poll every 3 seconds for real-time messages
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [isOpen, sessionId])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || sending) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setSending(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to send message')
      }

      const created = await response.json()
      setMessages((prev) => [...prev, created])
      scrollToBottom()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setInputMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-xl h-[82vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={peerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`}
              alt={peerName}
              className="w-10 h-10 rounded-full border border-border object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{peerName}</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {peerRole}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[260px] sm:max-w-[340px]">
                Topic: {sessionTopic}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground text-sm">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Start the conversation with {peerName}! Ask questions, share agenda notes, or discuss preparation for your call.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {!isMe && (
                      <img
                        src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.name}`}
                        alt={msg.sender?.name}
                        className="w-6 h-6 rounded-full shrink-0 mb-1"
                      />
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-primary text-white rounded-br-xs shadow-xs'
                          : 'bg-card border border-border text-foreground rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-4 py-1.5 bg-destructive/10 text-destructive text-xs border-t border-destructive/20">
            {error}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card shrink-0 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${peerName}...`}
            className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            title="Send Message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
