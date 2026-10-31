import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, Clock, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: {bookingId?: string; sessionId?: string};
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rescheduleAction, setRescheduleAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const fetching = useRef(false);
  const reading = useRef(new Set<string>());
  const fetchNotifications = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const token = localStorage.getItem('token');
      const [notificationsRes, countRes] = await Promise.all([
        fetch('/api/connect/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/connect/notifications/count', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!notificationsRes.ok || !countRes.ok) throw new Error('Could not refresh notifications. Please retry.');
      setActionError('');
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data);
      }

      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unreadCount);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not refresh notifications.');
    } finally {
      setLoading(false); fetching.current = false;
    }
  }, []);

  const markAsRead = async (id: string) => {
    if (reading.current.has(id)) return;
    reading.current.add(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connect/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not mark notification as read. Please retry.');
      window.dispatchEvent(new Event('careerhub:notifications-changed'));
      setNotifications(previous => previous.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(previous => Math.max(0, previous - 1));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not mark notification as read.');
    } finally {reading.current.delete(id);}
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connect/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not mark notifications as read. Please retry.');
      window.dispatchEvent(new Event('careerhub:notifications-changed'));
      await fetchNotifications();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not mark notifications as read.');
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const decideReschedule = async (notification: Notification, decision: 'approve' | 'reject') => {
    const bookingId = notification.data?.bookingId;
    if (!bookingId) return;
    setRescheduleAction(notification.id);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connect/sessions/${bookingId}/reschedule/decision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not update the reschedule request.');
      await fetchNotifications();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the reschedule request.');
    } finally {
      setRescheduleAction(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void fetchNotifications();
    const refresh = () => {if (!document.hidden) void fetchNotifications();};
    const timer = setInterval(refresh,10000);
    window.addEventListener('focus',refresh);
    return () => {clearInterval(timer);window.removeEventListener('focus',refresh);};
  }, [isOpen,fetchNotifications]);

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'session_started': return 'bg-emerald-50 border-emerald-300 text-emerald-800';
      case 'session_request': return 'bg-primary/5 text-primary';
      case 'session_accepted': return 'bg-green-50 border-green-200 text-green-900';
      case 'session_rejected': return 'bg-red-50 border-red-200 text-red-900';
      case 'session_reminder': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default: return 'bg-muted/40 border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'session_started': return Video;
      case 'session_request': return Bell;
      case 'session_accepted': return Check;
      case 'session_rejected': return X;
      case 'session_reminder': return Clock;
      default: return Bell;
    }
  };

  return (
    <section aria-label="Notifications inbox" className="fixed right-0 top-0 h-full w-full max-w-sm bg-card text-card-foreground shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          aria-label="Close notifications"
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b">
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-sm text-primary hover:text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {actionError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{actionError} <button onClick={() => void fetchNotifications()} className="underline">Retry</button></p>}
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              const isSessionStarted = notification.type === 'session_started';
              const isRescheduleRequest = notification.type === 'session_reschedule_request' && !notification.isRead;
              return (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    notification.isRead ? 'opacity-60' : getTypeColor(notification.type)
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      notification.isRead ? 'bg-muted' : getTypeColor(notification.type)
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      
                      {!notification.isRead && !isRescheduleRequest && <button type="button" onClick={() => void markAsRead(notification.id)} className="mt-2 mr-3 text-xs font-semibold text-primary underline">Mark as read</button>}
                      {isSessionStarted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notification.isRead) markAsRead(notification.id);
                            onClose();
                            const sid = notification.data?.sessionId;
                            const base = JSON.parse(localStorage.getItem('user') || '{}').role === 'MENTOR' ? '/mentor' : '/connect/sessions';
                            navigate(sid ? `${base}?join=${encodeURIComponent(sid)}` : base);
                          }}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" /> Start Meet / Join Now
                        </button>
                      )}

                      {!isSessionStarted && (notification.data?.bookingId || notification.data?.sessionId) && <button type="button" onClick={(event) => {
                        event.stopPropagation();
                        if (!notification.isRead && !isRescheduleRequest) void markAsRead(notification.id);
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const base = user.role === 'MENTOR' ? '/mentor' : '/connect/sessions';
                        const id = notification.data.bookingId || notification.data.sessionId;
                        navigate(`${base}?${notification.type === 'session_message' ? 'chat' : 'session'}=${encodeURIComponent(id)}`); onClose();
                      }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline">{notification.type === 'session_message' ? 'Open conversation' : 'View session'}</button>}

                      {isRescheduleRequest && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void decideReschedule(notification, 'approve');
                            }}
                            disabled={rescheduleAction === notification.id}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            <Check className="size-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void decideReschedule(notification, 'reject');
                            }}
                            disabled={rescheduleAction === notification.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                          >
                            <X className="size-3.5" /> Reject
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary/50 rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default NotificationsPanel;