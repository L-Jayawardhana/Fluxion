import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addComment } from '../../services/maintenanceLogService';

const relativeTime = (value) => {
  if (!value) return 'N/A';
  const delta = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(delta);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (abs < 60) return rtf.format(delta, 'second');
  if (abs < 3600) return rtf.format(Math.round(delta / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(delta / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(delta / 86400), 'day');
  return rtf.format(Math.round(delta / 604800), 'week');
};

const roleBadgeClass = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'owner') return 'ml-role-badge role-owner';
  if (r === 'technician') return 'ml-role-badge role-tech';
  if (r === 'user' || r === 'employee') return 'ml-role-badge role-employee';
  if (r === 'admin' || r === 'systemadmin') return 'ml-role-badge role-owner';
  return 'ml-role-badge';
};

export default function CommentsPanel({ comments, role, loading, ticketId }) {
  const navigate = useNavigate();
  const isOwner = role === 'owner' || role === 'admin' || role === 'systemadmin';
  const isTechnician = role === 'technician';
  const isEmployee = role === 'user' || role === 'employee';

  const [items, setItems] = useState(comments || []);
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showInternalOnly, setShowInternalOnly] = useState(false);

  useEffect(() => {
    setItems(comments || []);
  }, [comments]);

  const visibleItems = useMemo(() => {
    if (!isOwner || !showInternalOnly) return items;
    return items.filter(c => c.isVisibleToEmployee === false);
  }, [items, isOwner, showInternalOnly]);

  const pushToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !ticketId) return;
    setSubmitting(true);
    try {
      const res = await addComment(ticketId, {
        content: text.trim(),
        isVisibleToEmployee: !isInternal,
      });
      if (res?.isSuccess) {
        setItems(prev => [...prev, res.data]);
        setText('');
        setIsInternal(false);
        pushToast('success', 'Comment added.');
      } else {
        pushToast('error', res?.errorMessage || 'Failed to add comment.');
      }
    } catch (error) {
      pushToast('error', error.message || 'Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-comments">
        <div className="ml-comments-header">
          <div className="ml-skeleton" style={{ height: 18, width: 120 }} />
        </div>
        <div className="ml-comments-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ml-comment-card">
              <div className="ml-skeleton" style={{ height: 14, width: '40%' }} />
              <div className="ml-skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-comments">
      <div className="ml-comments-header">
        <div>
          <div className="ml-comments-title">Comments</div>
          <div className="ml-comments-sub">{items.length} notes</div>
        </div>
        {isOwner && (
          <label className="ml-toggle">
            <input
              type="checkbox"
              checked={showInternalOnly}
              onChange={(e) => setShowInternalOnly(e.target.checked)}
            />
            <span>Show internal notes only</span>
          </label>
        )}
      </div>

      {toast && (
        <div className={`ml-toast ml-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="ml-comments-list">
        {visibleItems.length === 0 ? (
          <div className="ml-empty">
            {isEmployee ? 'No technician notes available yet.' : 'No comments recorded yet.'}
          </div>
        ) : (
          visibleItems.map((c) => (
            <div key={c.logId} className="ml-comment-card">
              <div className="ml-comment-head">
                <div>
                  <span className="ml-comment-author">{c.authorName || 'Technician'}</span>
                  {!isEmployee && (
                    <span className={roleBadgeClass(c.authorRole)}>
                      {(c.authorRole || 'technician').toString().replace(/\b\w/g, (x) => x.toUpperCase())}
                    </span>
                  )}
                </div>
                <div className="ml-comment-meta">
                  <span>{relativeTime(c.createdAt)}</span>
                  {!isEmployee && c.isVisibleToEmployee === false && (
                    <span className="ml-lock">INTERNAL</span>
                  )}
                </div>
              </div>
              <div className="ml-comment-body">{c.content}</div>
            </div>
          ))
        )}
      </div>

      {isTechnician && (
        <form className="ml-comment-form" onSubmit={handleSubmit}>
          <div className="ml-field">
            <label htmlFor="ml-comment">Add Comment</label>
            <textarea
              id="ml-comment"
              rows={3}
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a note for this ticket..."
            />
            <div className="ml-field-footer">
              <label className="ml-toggle">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                <span>Mark as internal (hidden from employee)</span>
              </label>
              <span className="ml-counter">{text.length}/500</span>
            </div>
          </div>
          {!ticketId && (
            <div className="ml-empty">No assigned ticket available for comments.</div>
          )}
          <div className="ml-comment-actions">
            <button className="ml-btn" type="button" disabled={!ticketId} onClick={() => navigate(`/technician/tickets/${ticketId}`)}>
              Open ticket to log repair
            </button>
            <button className="ml-btn ml-btn-primary" type="submit" disabled={submitting || !text.trim() || !ticketId}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
