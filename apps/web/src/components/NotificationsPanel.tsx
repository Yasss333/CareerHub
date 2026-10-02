import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
      await fetch('/api/connect/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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
      case 'session_request': return 'bg-blue-50 border-blue-200';
      case 'session_accepted': return 'bg-green-50 border-green-200';
      case 'session_rejected': return 'bg-red-50 border-red-200';
      case 'session_reminder': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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
          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
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
              return (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.isRead ? 'opacity-60' : getTypeColor(notification.type)
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
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
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
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