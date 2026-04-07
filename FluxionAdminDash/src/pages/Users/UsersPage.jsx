import { useState, useEffect, useRef, useCallback } from 'react';
import { getUsers, deleteUser, updateUser } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

/* ── Constants ───────────────────────────────────────────── */
const ALL_ROLES = ['All', 'Owner', 'Admin', 'Technician', 'User', 'SystemAdmin'];

const ROLE_META = {
  Owner:       { bg: '#F5F3FF', color: '#7C3AED', dot: '#7C3AED' },
  Admin:       { bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
  Technician:  { bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
  User:        { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  SystemAdmin: { bg: '#FFF1F2', color: '#E11D48', dot: '#E11D48' },
};

const STAT_ICONS = {
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  pause:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01"/></svg>,
};

/* ── Animated number ─────────────────────────────────────── */
function AnimVal({ val }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 900;
    const t0 = performance.now();
    const end = val;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(ease * end).toLocaleString();
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [val]);
  return <span ref={ref}>{val}</span>;
}

/* ── Helpers ─────────────────────────────────────────────── */
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '000000'.substring(c.length) + c;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = new Date();
  const diffMs   = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return diffMins <= 1 ? 'Just now'  : `${diffMins}m ago`;
  if (diffHrs  < 24) return `${diffHrs}h ago`;
  if (diffDays < 7)  return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ████████████████████████████████████████████████████████ */
export default function UsersPage() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [saving,      setSaving]      = useState(false);
  const { addToast } = useToast();

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      const mapped = data.map(u => ({
        ...u,
        name:      u.fullName,
        role:      capitalize(u.role),
        org:       u.organizationName || null,
        status:    u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLoginAt,
        joined:    u.createdAt,
        color:     stringToColor(u.fullName),
      }));
      setUsers(mapped);
    } catch {
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

/* ── Stats ─────────────────────────────────────────────── */
const totalUsers    = users.length;
const activeUsers   = users.filter(u => u.isActive).length;
const inactiveUsers = users.filter(u => !u.isActive).length;
const adminUsers    = users.filter(u => u.role === 'Admin' || u.role === 'Owner').length;
const sysAdmins     = users.filter(u => u.role === 'Systemadmin' || u.role === 'SystemAdmin').length;
const noOrgUsers    = users.filter(u => !u.org).length;

const statCards = [
  { icon: 'users',    label: 'Total Users',     val: totalUsers,    sub: 'Across all orgs',       delta: `${totalUsers}`,    cls: 'cd-up',  acc: 'acc-blue'   },
  { icon: 'check',    label: 'Active',           val: activeUsers,   sub: 'Currently active',      delta: `${activeUsers}`,   cls: 'cd-ok',  acc: 'acc-green'  },
  { icon: 'pause',    label: 'Inactive',         val: inactiveUsers, sub: 'Deactivated accounts',  delta: `${inactiveUsers}`, cls: inactiveUsers > 0 ? 'cd-warn' : 'cd-ok', acc: 'acc-amber' },
  { icon: 'shield',   label: 'Admins',           val: adminUsers,    sub: 'Owners & Admins',       delta: `${adminUsers}`,    cls: 'cd-info', acc: 'acc-indigo' },
  { icon: 'star',     label: 'System Admins',    val: sysAdmins,     sub: 'Super admin access',    delta: `${sysAdmins}`,     cls: 'cd-info', acc: 'acc-violet' },
  { icon: 'building', label: 'No Organisation',  val: noOrgUsers,    sub: 'Unassigned users',      delta: `${noOrgUsers}`, cls: noOrgUsers > 0 ? 'cd-warn' : 'cd-ok', acc: 'acc-red' },
];

/* ── Filter + Search ───────────────────────────────────── */
const roleCount = (r) => users.filter(u => u.role === r).length;
  
  const filtered = users.filter(u => {
    const matchRole   = filter === 'All' || u.role === filter;
    const matchSearch = !search || [u.name, u.email, u.org].some(
      v => v && v.toLowerCase().includes(search.toLowerCase())
    );
    return matchRole && matchSearch;
  });

  /* ── Actions ───────────────────────────────────────────── */
  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      addToast('User deleted successfully', 'success');
      fetchData();
    } catch {
      addToast('Failed to delete user', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.userId, {
        userId:   editingUser.userId,
        fullName: editingUser.name,
        email:    editingUser.email,
        role:     editingUser.role,
        isActive: editingUser.isActive,
        orgId:    editingUser.orgId,
      });
      addToast('User updated successfully', 'success');
      setEditingUser(null);
      fetchData();
    } catch {
      addToast('Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading users…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Confirm Delete Modal ─────────────────────────── */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* ── Edit User Modal ──────────────────────────────── */}
      {editingUser && (
        <div className="overlay open" onClick={() => setEditingUser(null)}>
          <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: editingUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials(editingUser.name)}
                </div>
                <div>
                  <div className="modal-title">Edit User</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{editingUser.email}</div>
                </div>
              </div>
              <button className="modal-x" onClick={() => setEditingUser(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="m2">
                  <div className="mf">
                    <label className="ml">Full Name</label>
                    <input className="mi" type="text" placeholder="John Doe"
                      value={editingUser.name}
                      onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                      required />
                  </div>
                  <div className="mf">
                    <label className="ml">Email Address</label>
                    <input className="mi" type="email" placeholder="john@example.com"
                      value={editingUser.email}
                      onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                      required />
                  </div>
                </div>

                <div className="mf">
                  <label className="ml">Role</label>
                  <select className="ms"
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                    {ALL_ROLES.filter(r => r !== 'All').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="mf" style={{ marginBottom: 0 }}>
                  <label className="ml">Account Status</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    {[true, false].map(val => (
                      <label key={String(val)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        border: `1.5px solid ${editingUser.isActive === val ? (val ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                        borderRadius: 8, cursor: 'pointer',
                        background: editingUser.isActive === val ? (val ? '#F0FDF4' : '#FEF2F2') : 'var(--faint)',
                        transition: 'all .15s'
                      }}>
                        <input type="radio" name="uStatus" style={{ display: 'none' }}
                          checked={editingUser.isActive === val}
                          onChange={() => setEditingUser({ ...editingUser, isActive: val })} />
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: val ? 'var(--green)' : '#94A3B8',
                          boxShadow: val && editingUser.isActive ? '0 0 6px var(--green)' : 'none'
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: editingUser.isActive === val ? (val ? 'var(--green)' : '#DC2626') : 'var(--muted)' }}>
                          {val ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="mc" onClick={() => setEditingUser(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="mok" disabled={saving} style={{ minWidth: 120, opacity: saving ? .7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stats Strip ─────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6,1fr)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, margin: '20px 24px 0',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden',
        animation: 'fadeUp .4s both'
      }}>
        {statCards.map((s, i) => (
          <div key={i} className={`strip-cell ${s.acc}`}>
            <div className="cell-top">
              <span className="cell-icon">{STAT_ICONS[s.icon]}</span>
              <span className={`cell-delta ${s.cls}`}>{s.delta}</span>
            </div>
            <div className="cell-val"><AnimVal val={s.val} /></div>
            <div className="cell-label">{s.label}</div>
            <div className="cell-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Page Content ────────────────────────────────── */}
      <div className="pad" style={{ paddingTop: 20 }}>

        {/* ── Filter + Search Bar ─────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ALL_ROLES.map(r => (
              <button key={r} className={`fpill${filter === r ? ' active' : ''}`}
                onClick={() => setFilter(r)}>
                {r}
                {r !== 'All' && (
                  <span style={{
                    marginLeft: 5, fontSize: 9, fontWeight: 700,
                    background: filter === r ? 'rgba(255,255,255,.28)' : 'var(--border)',
                    color: filter === r ? '#fff' : 'var(--dim)',
                    padding: '1px 5px', borderRadius: 9,
                  }}>
                    {roleCount(r)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="fspacer" />

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--dim)', pointerEvents: 'none' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search name, email, org…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '7px 32px 7px 30px', fontSize: 11, fontFamily: 'var(--font)',
                border: '1.5px solid var(--border)', borderRadius: 8,
                background: 'var(--surface)', color: 'var(--text)', outline: 'none',
                width: 224, transition: 'border-color .15s, box-shadow .15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,114,246,.1)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)';  e.target.style.boxShadow = 'none'; }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)',
                display: 'flex', alignItems: 'center', padding: 0, lineHeight: 1
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {/* ── Table ───────────────────────────────────── */}
        <div className="panel" style={{ animation: 'fadeUp .4s .1s both' }}>
          {filtered.length === 0 ? (
            /* Empty state */
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--faint)', border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--dim)'
              }}>
                {STAT_ICONS.users}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {search || filter !== 'All' ? 'No users match your filters' : 'No users found'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 320, margin: '0 auto' }}>
                {search || filter !== 'All'
                  ? 'Try adjusting your search term or selecting a different role filter.'
                  : 'Users will appear here once accounts have been created on the platform.'}
              </div>
              {(search || filter !== 'All') && (
                <button onClick={() => { setSearch(''); setFilter('All'); }}
                  style={{ marginTop: 16, padding: '7px 18px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .15s' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="bigtbl">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>User</th>
                  <th style={{ width: '12%' }}>Role</th>
                  <th style={{ width: '17%' }}>Organisation</th>
                  <th style={{ width: '9%'  }}>Status</th>
                  <th style={{ width: '16%' }}>Last Login</th>
                  <th style={{ width: '14%' }}>Member Since</th>
                  <th style={{ width: '7%'  }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rm = ROLE_META[u.role] || ROLE_META.User;
                  return (
                    <tr key={u.userId}>

                      {/* Avatar + name + email */}
                      <td>
                        <div className="org-cell">
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', background: u.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                            boxShadow: '0 1px 4px rgba(0,0,0,.14)'
                          }}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <div className="org-name">{u.name}</div>
                            <div className="org-slug">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role badge with dot */}
                      <td>
                        <span style={{
                          background: rm.bg, color: rm.color,
                          fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                          display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '.2px'
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: rm.dot, flexShrink: 0 }} />
                          {u.role}
                        </span>
                      </td>

                      {/* Organisation with mini avatar */}
                      <td>
                        {u.org ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: 5,
                              background: stringToColor(u.org),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0
                            }}>
                              {u.org[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{u.org}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--dim)', fontStyle: 'italic' }}>No org</span>
                        )}
                      </td>

                      {/* Status pill */}
                      <td>
                        <span className={`spill ${u.isActive ? 'sp-active' : 'sp-inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Last login with clock icon */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <svg style={{ width: 11, height: 11, color: u.lastLogin ? 'var(--dim)' : 'var(--border)', flexShrink: 0 }}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span style={{ fontSize: 11, color: 'var(--dim)' }}>{formatDate(u.lastLogin)}</span>
                        </div>
                      </td>

                      {/* Joined */}
                      <td style={{ fontSize: 11, color: 'var(--dim)' }}>
                        {u.joined
                          ? new Date(u.joined).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="row-acts">
                          <button className="ract" title="Edit user" onClick={() => setEditingUser({ ...u })}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button className="ract del" title="Delete user" onClick={() => setDeleteId(u.userId)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer count ────────────────────────────── */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 2px' }}>
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> of{' '}
              <strong style={{ color: 'var(--text)' }}>{totalUsers}</strong> users
            </span>
            {(filter !== 'All' || search) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {filter !== 'All' && (
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Role: <strong style={{ color: 'var(--text)' }}>{filter}</strong>
                  </span>
                )}
                <button onClick={() => { setFilter('All'); setSearch(''); }}
                  className="fpill" style={{ padding: '3px 10px', fontSize: 10 }}>
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}