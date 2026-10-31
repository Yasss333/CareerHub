import {useEffect,useState} from 'react'
import {Bell} from 'lucide-react'

export default function NotificationBell({onOpen}: {onOpen: () => void}) {
  const [count,setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    let busy = false
    const refresh = async () => {
      if (busy || document.hidden) return
      busy = true
      try {
        const response = await fetch('/api/connect/notifications/count',{headers:{Authorization:`Bearer ${localStorage.getItem('token') || ''}`},signal:AbortSignal.timeout(12000)})
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && Number.isInteger(data.unreadCount)) setCount(Math.max(0,data.unreadCount))
      } catch { /* Preserve the previous badge during a network interruption. */ }
      finally {busy = false}
    }
    void refresh()
    const timer = setInterval(() => void refresh(),15000)
    window.addEventListener('focus',refresh);window.addEventListener('careerhub:notifications-changed',refresh)
    return () => {cancelled = true; clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('careerhub:notifications-changed',refresh)}
  }, [])
  return <button type="button" onClick={onOpen} aria-label={`Notifications${count ? `, ${count} unread` : ''}`} title="Notifications" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><Bell className="size-5"/>{count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}</button>
}
