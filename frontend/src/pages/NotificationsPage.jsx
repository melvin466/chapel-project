import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this notification.');
    }
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.type === 'announcement' && notification.data?.announcementId) {
      navigate(`/announcements/${notification.data.announcementId}`);
      return;
    }

    if (notification.type === 'booking') {
      navigate('/bookings');
      return;
    }

    if (notification.data?.cellId) {
      navigate('/cells');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setMessage('All notifications marked as read.');
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update notifications.');
    }
  };

  return (
    <div className="container notifications-page">
      <div className="notifications-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
        </div>
        <button type="button" className="btn-primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
          Mark All Read
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="member-empty">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="member-empty">No notifications yet.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={`notification-item ${notification.isRead ? '' : 'unread'}`}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openNotification(notification);
              }}
            >
              <div className="notification-icon">{notification.type?.slice(0, 1).toUpperCase() || 'N'}</div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{formatTime(notification.createdAt)}</span>
              </div>
              {!notification.isRead && <span className="unread-dot" aria-label="Unread" />}
              {!notification.isRead && (
                <button type="button" className="btn-secondary" onClick={(event) => {
                  event.stopPropagation();
                  markAsRead(notification._id);
                }}>
                  Mark Read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
