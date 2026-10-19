import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
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

  const fetchNotifications = async () => {
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

      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data);
      }

      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/connect/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/connect/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchNotifications();
    } catch (error) {
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
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'session_started': return 'bg-emerald-50 border-emerald-300 text-emerald-800';
      case 'session_request': return 'bg-primary/5 text-primary/15';
      case 'session_accepted': return 'bg-green-50 border-green-200';
      case 'session_rejected': return 'bg-red-50 border-red-200';
      case 'session_reminder': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
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
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
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
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b">
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-sm text-primary hover:text-primary disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {actionError && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{actionError}</p>}
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
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
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.isRead ? 'opacity-60' : getTypeColor(notification.type)
                  }`}
                  onClick={() => !notification.isRead && notification.type !== 'session_reschedule_request' && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      notification.isRead ? 'bg-gray-100' : getTypeColor(notification.type)
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      
                      {isSessionStarted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notification.isRead) markAsRead(notification.id);
                            onClose();
                            const sid = notification.data?.sessionId;
                            navigate(sid ? `/connect/sessions?join=${sid}` : '/connect/sessions');
                          }}
                          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" /> Start Meet / Join Now
                        </button>
                      )}

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

                      <p className="text-xs text-gray-400 mt-2">
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
    </div>
  );
};

export default NotificationsPanel;