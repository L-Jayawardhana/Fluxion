import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './UsersPage.css';

/* ── SVG icons ───────────────────────────────── */
const Icons = {
  refresh: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 8a7 7 0 0013.3-3M15 8A7 7 0 001.7 11" strokeLinecap="round"/><path d="M12 1l2.3 4-4 .3M4 15l-2.3-4 4-.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5.3 4V2.7a.7.7 0 01.7-.7h4a.7.7 0 01.7.7V4M6 7v5M10 7v5M3.5 4l.7 9.3a1 1 0 001 .7h5.6a1 1 0 001-.7L12.5 4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2" strokeLinecap="round"/></svg>,
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';



/* ████████████████████████████████████████████████ */
export default function UsersPage() {
  const { user } = useAuth();
  const currentOrgId = user?.orgId;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);



  /* ── Load users ── */
  const loadUsers = useCallback(() => {
    if (!currentOrgId) return;
    setLoading(true);
    setError('');
    api.get(`/User?orgId=${currentOrgId}`)
      .then(res => {
        // Exclude the current owner from the list — they don't need to see themselves
        const others = res.data.filter(u => u.userId !== Number(user?.userId));
        setUsers(others);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, [currentOrgId, user?.userId]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ── Delete user ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/User/${deleteTarget.userId}`);
      setUsers(prev => prev.filter(u => u.userId !== deleteTarget.userId));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Filter ── */
  const filtered =
    filter === 'Accepted'  ? users.filter(u => u.invitationAccepted) :
    filter === 'Pending'   ? users.filter(u => !u.invitationAccepted) :
    users;

  const acceptedCount = users.filter(u => u.invitationAccepted).length;
  const pendingCount  = users.filter(u => !u.invitationAccepted).length;

  /* ── Render ── */
  return (
    <div className="page up-page">

      {/* ── Delete confirm overlay ── */}
      {deleteTarget && (
        <div className="up-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="up-confirm" onClick={e => e.stopPropagation()}>
            <div className="up-confirm-icon">🗑️</div>
            <div className="up-confirm-title">Delete User</div>
            <div className="up-confirm-msg">
              Are you sure you want to permanently delete <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email})?
              This action cannot be undone.
            </div>
            <div className="up-confirm-acts">
              <button className="up-btn up-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="up-btn up-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="up-header">
        <div>
          <div className="up-eyebrow">People Management</div>
          <h1 className="up-title">Users</h1>
          <p className="up-subtitle">View invited employees and manage their access.</p>
        </div>
        <div className="up-header-actions">
          <button className="up-btn-refresh" onClick={loadUsers} title="Refresh">
            {Icons.refresh} Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="up-error">⚠ {error}</div>}

      {/* ── Stats ── */}
      {!loading && (
        <div className="up-stats-row">
          <div className="up-stat blue">
            <div className="up-stat-icon">{Icons.user}</div>
            <div>
              <div className="up-stat-val">{users.length}</div>
              <div className="up-stat-lbl">Total Users</div>
            </div>
          </div>
          <div className="up-stat green">
            <div className="up-stat-icon green">{Icons.check}</div>
            <div>
              <div className="up-stat-val">{acceptedCount}</div>
              <div className="up-stat-lbl">Accepted</div>
            </div>
          </div>
          <div className="up-stat amber">
            <div className="up-stat-icon amber">{Icons.clock}</div>
            <div>
              <div className="up-stat-val">{pendingCount}</div>
              <div className="up-stat-lbl">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="up-panel">
        <div className="up-panel-head">
          <div className="up-panel-title">All Users</div>
          <div className="up-controls">
            <div className="up-filter-pills">
              {['All', 'Accepted', 'Pending'].map(f => (
                <button
                  key={f}
                  className={`up-pill${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  {f === 'Accepted' && ` · ${acceptedCount}`}
                  {f === 'Pending' && ` · ${pendingCount}`}
                </button>
              ))}
            </div>
            <span className="up-panel-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {loading ? (
          <div className="up-loading"><div className="up-spinner" /> Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="up-empty">
            <div className="up-empty-icon">👥</div>
            <div className="up-empty-title">
              {users.length === 0 ? 'No users invited yet' : `No ${filter.toLowerCase()} users`}
            </div>
            <div className="up-empty-sub">
              {users.length === 0
                ? 'Invite your first employee from the Invite Users page.'
                : 'Try switching the filter above.'}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="up-table-wrap">
              <table className="up-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Invitation</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <React.Fragment key={u.userId}>
                      <tr>
                        <td>
                          <div className="up-user-cell">
                            <div className="up-avatar" style={{ background: u.invitationAccepted ? 'var(--db-blue)' : 'var(--db-amber)' }}>
                              {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="up-user-name">{u.fullName}</div>
                              <div className="up-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="up-role-chip">{u.role}</span></td>
                        <td>
                          <span className={`up-inv-badge ${u.invitationAccepted ? 'accepted' : 'pending'}`}>
                            {u.invitationAccepted ? Icons.check : Icons.clock}
                            {u.invitationAccepted ? 'Accepted' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`up-status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="up-date">{fmtDate(u.createdAt)}</td>
                        <td>
                          <button
                            className="up-delete-btn"
                            title="Delete user"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}
                          >
                            {Icons.trash}
                          </button>
                        </td>
                      </tr>

                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="up-cards">
              {filtered.map(u => (
                <div key={u.userId} className="up-card">
                  <div className="up-card-top">
                    <div className="up-user-cell">
                      <div className="up-avatar" style={{ background: u.invitationAccepted ? 'var(--db-blue)' : 'var(--db-amber)' }}>
                        {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="up-user-name">{u.fullName}</div>
                        <div className="up-user-email">{u.email}</div>
                      </div>
                    </div>
                    <button className="up-delete-btn" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}>
                      {Icons.trash}
                    </button>
                  </div>
                  <div className="up-card-row">
                    <span className="up-role-chip">{u.role}</span>
                    <span className={`up-inv-badge ${u.invitationAccepted ? 'accepted' : 'pending'}`}>
                      {u.invitationAccepted ? Icons.check : Icons.clock}
                      {u.invitationAccepted ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                  <div className="up-card-footer">
                    <span className={`up-status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="up-card-date">{fmtDate(u.createdAt)}</span>
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
