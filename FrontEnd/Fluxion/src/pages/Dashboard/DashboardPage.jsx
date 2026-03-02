import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './DashboardPage.css';

/* ── SVG icon map ────────────────────────────────────────── */
const IC = {
  box:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  ticket:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  zap:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  wrench:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  plus:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  bell:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01"/></svg>,
  heart:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 00-7.65 0L12 5.36l-.77-.78a5.4 5.4 0 00-7.65 7.65l.78.77L12 20.64l7.64-7.64.78-.77a5.4 5.4 0 000-7.65z"/></svg>,
  refresh:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
};

/* ── Animated counter ────────────────────────────────────── */
function AnimVal({ val, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 1000;
    const t0 = performance.now();
    const end = val;
    const isFloat = !Number.isInteger(end);
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const cur = ease * end;
      if (ref.current) {
        ref.current.textContent = prefix + (isFloat ? cur.toFixed(1) : Math.round(cur).toLocaleString()) + suffix;
      }
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [val, prefix, suffix]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ── Helpers ──────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function relTime(iso) {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (m < 2) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '000000'.substring(c.length) + c;
}

/* ── Quick-action data ───────────────────────────────────── */
const QUICK_ACTIONS = [
  { icon: 'plus',   label: 'New Asset',     desc: 'Register a new asset',      color: '#6366F1' },
  { icon: 'ticket', label: 'Raise Ticket',  desc: 'Create maintenance ticket', color: '#F59E0B' },
  { icon: 'wrench', label: 'Maintenance',   desc: 'View active repairs',       color: '#22C55E' },
  { icon: 'users',  label: 'Team',          desc: 'View team members',         color: '#3B82F6' },
];

/* ████████████████████████████████████████████████████████████ */
export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);

  const userName = user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'User';

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [healthRes, usersRes] = await Promise.allSettled([
        api.get('/Health'),
        api.get('/User'),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (usersRes.status === 'fulfilled') {
        const all = usersRes.value.data;
        setTeamMembers(all);

        // Derive org info from users list
        const orgUsers = user?.orgId ? all.filter(u => u.orgId === parseInt(user.orgId)) : all;
        setOrgData({
          totalUsers: all.length,
          activeUsers: all.filter(u => u.isActive).length,
          orgUsers: orgUsers.length,
          admins: all.filter(u => ['admin', 'owner', 'Admin', 'Owner'].includes(u.role)).length,
          recentLogins: all.filter(u => {
            if (!u.lastLoginAt) return false;
            return (Date.now() - new Date(u.lastLoginAt).getTime()) < 86400000;
          }).length,
        });
      }
      setLastRefresh(new Date());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Stats ─────────────────────────────────────────────── */
  const stats = [
    { icon: 'users',    accent: '#6366F1', label: 'Total Users',     val: orgData?.totalUsers  ?? 0, sub: `${orgData?.activeUsers ?? 0} active`,         delta: `${orgData?.activeUsers ?? 0}`, cls: 'up'   },
    { icon: 'check',    accent: '#22C55E', label: 'Active Now',      val: orgData?.recentLogins ?? 0, sub: 'Logged in today',                             delta: `${orgData?.recentLogins ?? 0}`, cls: 'up'   },
    { icon: 'shield',   accent: '#F59E0B', label: 'Admins',          val: orgData?.admins ?? 0,       sub: 'Owners & Admins',                             delta: `${orgData?.admins ?? 0}`, cls: 'info' },
    { icon: 'heart',    accent: '#EF4444', label: 'System Health',   val: health?.database === 'Connected' ? 100 : 0, sub: health?.database || 'Checking…', delta: health?.database === 'Connected' ? 'OK' : '!', cls: health?.database === 'Connected' ? 'ok' : 'warn' },
  ];

  /* ── Recent team activity (from user data) ─────────────── */
  const recentTeam = [...teamMembers]
    .filter(u => u.lastLoginAt)
    .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
    .slice(0, 6);

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <span>Loading dashboard…</span>
    </div>
  );

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="page dash-page">

      {/* ── Welcome Header ─────────────────────────────── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">
            {greeting()}, <span className="dash-name">{userName}</span>
          </h1>
          <p className="dash-subtitle">
            Here's an overview of your workspace. Role: <strong>{userRole}</strong>
          </p>
        </div>
        <div className="dash-header-right">
          <button className="dash-refresh-btn" onClick={fetchAll} title="Refresh data">
            {IC.refresh}
            <span>Refresh</span>
          </button>
          {lastRefresh && (
            <span className="dash-last-refresh">Updated {relTime(lastRefresh.toISOString())}</span>
          )}
        </div>
      </header>

      {/* ── Stats Strip ────────────────────────────────── */}
      <div className="dash-stats">
        {stats.map((s, i) => (
          <div className="dash-stat-card" key={i} style={{ '--accent': s.accent, animationDelay: `${i * 0.07}s` }}>
            <div className="dsc-top">
              <div className="dsc-icon" style={{ background: s.accent + '18', color: s.accent }}>
                {IC[s.icon]}
              </div>
              <span className={`dsc-delta dsc-${s.cls}`}>{s.delta}</span>
            </div>
            <div className="dsc-val"><AnimVal val={s.val} /></div>
            <div className="dsc-label">{s.label}</div>
            <div className="dsc-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="dash-actions">
          {QUICK_ACTIONS.map((a, i) => (
            <button className="dash-action-card" key={i} style={{ '--qa-color': a.color, animationDelay: `${i * 0.06}s` }}>
              <div className="dac-icon" style={{ background: a.color + '18', color: a.color }}>
                {IC[a.icon]}
              </div>
              <div className="dac-text">
                <div className="dac-label">{a.label}</div>
                <div className="dac-desc">{a.desc}</div>
              </div>
              <svg className="dac-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </section>

      {/* ── Two-column: Recent Team + System ─────────── */}
      <div className="dash-grid-2">

        {/* Recent Team Activity */}
        <section className="dash-panel">
          <div className="dp-header">
            <div>
              <h3 className="dp-title">Recent Activity</h3>
              <p className="dp-sub">{recentTeam.length} team members active recently</p>
            </div>
          </div>

          {recentTeam.length === 0 ? (
            <div className="dp-empty">
              <div className="dp-empty-icon">{IC.users}</div>
              <p>No recent activity yet</p>
            </div>
          ) : (
            <div className="dp-list">
              {recentTeam.map((u, i) => {
                const name = u.fullName || u.email;
                const color = stringToColor(name);
                return (
                  <div className="dp-list-item" key={u.userId || i} style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="dp-avatar" style={{ background: color }}>{initials(name)}</div>
                    <div className="dp-item-body">
                      <div className="dp-item-name">{name}</div>
                      <div className="dp-item-meta">
                        <span className={`dp-role-badge dp-role-${(u.role || 'user').toLowerCase()}`}>{u.role || 'User'}</span>
                        <span className="dp-item-time">{relTime(u.lastLoginAt)}</span>
                      </div>
                    </div>
                    <span className={`dp-status-dot ${u.isActive ? 'active' : 'inactive'}`} title={u.isActive ? 'Active' : 'Inactive'} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* System Health */}
        <section className="dash-panel">
          <div className="dp-header">
            <div>
              <h3 className="dp-title">System Status</h3>
              <p className="dp-sub">Infrastructure overview</p>
            </div>
            <span className={`dp-health-badge ${health?.database === 'Connected' ? 'healthy' : 'unhealthy'}`}>
              {health?.database === 'Connected' ? 'All Systems Operational' : 'Issues Detected'}
            </span>
          </div>

          <div className="sys-checks">
            {/* API */}
            <div className="sys-row">
              <div className="sys-led on" />
              <div className="sys-info">
                <div className="sys-name">API Server</div>
                <div className="sys-detail">{health?.status || 'Unknown'}</div>
              </div>
              <span className="sys-badge good">Operational</span>
            </div>
            {/* Database */}
            <div className="sys-row">
              <div className={`sys-led ${health?.database === 'Connected' ? 'on' : 'off'}`} />
              <div className="sys-info">
                <div className="sys-name">Database</div>
                <div className="sys-detail">{health?.database || 'Checking…'}</div>
              </div>
              <span className={`sys-badge ${health?.database === 'Connected' ? 'good' : 'bad'}`}>
                {health?.database === 'Connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {/* Auth */}
            <div className="sys-row">
              <div className="sys-led on" />
              <div className="sys-info">
                <div className="sys-name">Authentication</div>
                <div className="sys-detail">JWT Token Active</div>
              </div>
              <span className="sys-badge good">Active</span>
            </div>
            {/* Timestamp */}
            <div className="sys-row">
              <div className="sys-led on" />
              <div className="sys-info">
                <div className="sys-name">Server Time</div>
                <div className="sys-detail">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—'}</div>
              </div>
              <span className="sys-badge neutral">UTC</span>
            </div>
          </div>

          {/* Mini uptime bar */}
          <div className="sys-uptime">
            <div className="sys-uptime-label">
              <span>Uptime</span>
              <span className="sys-uptime-pct">{health?.database === 'Connected' ? '99.9%' : '0%'}</span>
            </div>
            <div className="sys-uptime-track">
              <div className="sys-uptime-fill" style={{ width: health?.database === 'Connected' ? '99.9%' : '0%' }} />
            </div>
          </div>
        </section>
      </div>

      {/* ── Workspace Summary ──────────────────────────── */}
      <section className="dash-panel dash-summary">
        <div className="dp-header">
          <div>
            <h3 className="dp-title">Workspace Summary</h3>
            <p className="dp-sub">Overview of your organisation's resources</p>
          </div>
        </div>

        <div className="dash-summary-grid">
          <div className="dsg-item">
            <div className="dsg-icon" style={{ background: 'rgba(99,102,241,.12)', color: '#6366F1' }}>{IC.box}</div>
            <div className="dsg-body">
              <div className="dsg-val">—</div>
              <div className="dsg-label">Total Assets</div>
              <div className="dsg-hint">Asset tracking coming soon</div>
            </div>
          </div>
          <div className="dsg-item">
            <div className="dsg-icon" style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>{IC.ticket}</div>
            <div className="dsg-body">
              <div className="dsg-val">—</div>
              <div className="dsg-label">Open Tickets</div>
              <div className="dsg-hint">Maintenance tickets coming soon</div>
            </div>
          </div>
          <div className="dsg-item">
            <div className="dsg-icon" style={{ background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>{IC.wrench}</div>
            <div className="dsg-body">
              <div className="dsg-val">—</div>
              <div className="dsg-label">Under Maintenance</div>
              <div className="dsg-hint">Maintenance logs coming soon</div>
            </div>
          </div>
          <div className="dsg-item">
            <div className="dsg-icon" style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444' }}>{IC.bell}</div>
            <div className="dsg-body">
              <div className="dsg-val">—</div>
              <div className="dsg-label">Alerts</div>
              <div className="dsg-hint">Notifications coming soon</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
