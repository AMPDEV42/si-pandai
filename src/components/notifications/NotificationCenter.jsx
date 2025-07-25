import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/customSupabaseClient';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';

const ICON_MAP = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// Memoize the notification item component for better performance
const NotificationItem = React.memo(({ notification, onMarkAsRead, onNotificationClick }) => {
  return (
    <li
      className={`relative hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50' : ''
      } ${notification.isNew ? 'animate-pulse' : ''}`}
    >
      <a
        href={notification.link || '#'}
        className="block p-3"
        onClick={(e) => onNotificationClick(notification, e)}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {ICON_MAP.info}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </p>
              <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatTimeAgo(notification.created_at)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
        {!notification.is_read && (
          <div className="absolute top-3 right-3">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          </div>
        )}
      </a>
    </li>
  );
});

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getNotifications(user.id, { limit: 20 });

      if (result.error) {
        throw result.error;
      }

      const data = result.data || [];
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error loading notifications:', err);
      const errorMessage = err.message?.includes('column')
        ? 'Sistem notifikasi sedang dalam pemeliharaan. Fitur akan kembali normal sebentar lagi.'
        : 'Gagal memuat notifikasi. Silakan muat ulang halaman.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // Disable real-time notifications for now to prevent errors
    // TODO: Re-enable when notifications table is properly configured
    console.log('Real-time notifications disabled - using polling instead');

    // Set up periodic polling as fallback
    const pollInterval = setInterval(() => {
      if (user?.id) {
        loadNotifications();
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(pollInterval);
    };

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.id, loadNotifications]);

  const markAsRead = async (id, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      await markNotificationAsRead(id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead(user.id);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification, event) => {
    if (!notification.is_read) {
      markAsRead(notification.id, event);
    }
    if (notification.link) {
      event.preventDefault();
      window.location.href = notification.link;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label="Notifikasi"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce"
            aria-live="polite"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200 ease-in-out"
          role="dialog"
          aria-modal="true"
          aria-label="Daftar notifikasi"
        >
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-800">Notifikasi</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                  aria-label="Tandai semua sudah dibaca"
                >
                  Tandai semua terbaca
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
                <button 
                  onClick={loadNotifications}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Info className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onNotificationClick={handleNotificationClick}
                  />
                ))}
              </ul>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center bg-gray-50 rounded-b-lg">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:underline focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                Lihat Semua Notifikasi
              </a>
            </div>
          )}
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default NotificationCenter;
