import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/notificationService';
import './NotificationsPage.css';

const TYPE_ICONS = {
  asset_assigned:           '📦',
  ticket_status_updated:    '🔄',
  asset_condition_updated:  '🛠️',
};

const TYPE_LABELS = {
  asset_assigned:           'Asset Assigned',
  ticket_status_updated:    'Ticket Update',
  asset_condition_updated:  'Condition Update',
};

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const pageSize = 15;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(
        page,
        pageSize,
        filter === 'unread' ? true : null
      );
      setNotifications(data.items || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClick = (n) => {
    if (!n.isRead) handleMarkRead(n.notificationId);

    // Navigate to relevant page
    if (n.type === 'ticket_status_updated' && n.ticketId) {
      navigate('/tickets');
    } else if (n.type === 'asset_assigned' || n.type === 'asset_condition_updated') {
      navigate('/assigned-assets');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page notif-page">

      {/* Header */}
      <div className="notif-header">
        <h1>Notifications</h1>
        <div className="notif-header-actions">
          <div className="notif-filter-tabs">
            <button
              className={`notif-tab${filter === 'all' ? ' active' : ''}`}
              onClick={() => { setFilter('all'); setPage(1); }}
            >
              All
            </button>
            <button
              className={`notif-tab${filter === 'unread' ? ' active' : ''}`}
              onClick={() => { setFilter('unread'); setPage(1); }}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="notif-stats">
        <div className="notif-stat">
          <span className="dot unread" />
          <strong>{unreadCount}</strong> unread
        </div>
        <div className="notif-stat">
          <span className="dot total" />
          <strong>{total}</strong> total
        </div>
      </div>

      {/* List */}
      <div className="notif-list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="notif-skeleton">
              <div className="sk-icon" />
              <div className="sk-body">
                <div className="sk-line w60" />
                <div className="sk-line w80" />
                <div className="sk-line w40" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
            <p>
              {filter === 'unread'
                ? 'You\'re all caught up! All notifications have been read.'
                : 'When someone assigns you an asset or updates your ticket, you\'ll see it here.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notificationId}
              className={`notif-item${!n.isRead ? ' unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className={`notif-icon ${n.type}`}>
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              <div className="notif-body">
                <div className="notif-title-row">
                  <span className="notif-title">{n.title}</span>
                  <span className="notif-time">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="notif-message">{n.message}</div>
                <span className={`notif-badge ${n.type}`}>
                  {TYPE_LABELS[n.type] || n.type}
                </span>
              </div>
              {!n.isRead && <span className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="notif-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
