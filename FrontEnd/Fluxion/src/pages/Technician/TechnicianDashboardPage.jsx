import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getTechnicianDashboardStats } from '../../services/technicianService';
import './Technician.css';

/* ── SVG Icons ─────────────────────────────────────────────── */
const Icons = {
  ticket:  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>,
  open:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7"/><path d="M5 8h6M5 5h6M5 11h3"/></svg>,
  wrench:  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 2.5a4 4 0 00-5.4 5.4L2 12l2 2 4.1-4.1A4 4 0 0011.5 2.5z"/></svg>,
  check:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  list:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="14" rx="2"/><path d="M4 8h8M4 5h8M4 11h5"/></svg>,
  chart:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3"/><rect x="1" y="1" width="14" height="14" rx="1.5"/></svg>,
};

/* ── AnimVal component ─────────────────────────────────────── */
function AnimVal({ val }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 900, t0 = performance.now(), end = val;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(ease * end);
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [val]);
  return <span ref={ref}>0</span>;
}

/* ── Priority bar ──────────────────────────────────────────── */
const PRIORITY_COLORS = { low: '#2D9456', medium: '#F0A500', high: '#E05A3C', critical: '#B91C1C' };

function PriorityBar({ label, count, max }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="tc-pri-row">
      <span className="tc-pri-label">{label}</span>
      <div className="tc-pri-track">
        <div className="tc-pri-fill" style={{ width: `${pct}%`, background: PRIORITY_COLORS[label.toLowerCase()] }} />
      </div>
      <span className="tc-pri-count">{count}</span>
    </div>
  );
}

/* ── Technician greeting ───────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtStatus(s) {
  return String(s || '').replace(/_/g, ' ');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ████████████████████████████████████████████████████████████ */
export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rawName = user?.email?.split('@')[0] || 'Technician';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getTechnicianDashboardStats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setError('Failed to load dashboard stats.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const kpis = [
    { label: 'Total Assigned', val: stats?.totalAssigned ?? 0, icon: Icons.ticket, color: 'blue' },
    { label: 'Open Tickets',   val: stats?.openTickets ?? 0,   icon: Icons.open,   color: 'rust' },
    { label: 'In Progress',    val: stats?.inProgress ?? 0,    icon: Icons.wrench, color: 'amber' },
    { label: 'Resolved',       val: stats?.resolved ?? 0,      icon: Icons.check,  color: 'green' },
  ];

  const pc = stats?.priorityCounts ?? { low: 0, medium: 0, high: 0, critical: 0 };
  const maxPri = Math.max(pc.low, pc.medium, pc.high, pc.critical, 1);

  return (
    <div className="tc-page">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="tc-header">
        <div>
          <div className="tc-eyebrow">Ticket Summary</div>
          <h1 className="tc-title">{greeting()}, {userName} 👋</h1>
          <p className="tc-subtitle">Overview of your assigned tickets and performance.</p>
        </div>
      </div>

      {error && <div className="tc-toast tc-toast-error">⚠ {error}</div>}

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="tc-kpi-grid">
        {kpis.map((k, i) => (
          <div className="tc-kpi" key={i} style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
            <div className={`tc-kpi-icon ${k.color}`}>{k.icon}</div>
            <div>
              <div className="tc-kpi-lbl">{k.label}</div>
              <div className="tc-kpi-val">
                {loading ? '—' : <AnimVal val={k.val} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row: Priority + Activity ──────────────────────── */}
      <div className="tc-row-3-2">

        {/* Priority Breakdown */}
        <div className="tc-panel">
          <div className="tc-panel-head">
            <span className="tc-panel-title">Priority Breakdown</span>
          </div>
          <div className="tc-panel-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="tc-skeleton" style={{ height: 14, width: `${60 + i * 10}%` }} />
                ))}
              </div>
            ) : (
              <div className="tc-pri-bar-wrap">
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <PriorityBar key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} count={pc[p]} max={maxPri} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="tc-panel">
          <div className="tc-panel-head">
            <span className="tc-panel-title">Recent Activity</span>
            <Link to="/technician/tickets" className="tc-panel-action">View all →</Link>
          </div>
          <div className="tc-panel-body" style={{ padding: '0 20px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="tc-skeleton" style={{ height: 36, borderRadius: 8 }} />
                ))}
              </div>
            ) : stats?.recentActivity?.length === 0 ? (
              <div className="tc-empty" style={{ padding: '30px 0' }}>
                <div className="tc-empty-icon">📋</div>
                <div className="tc-empty-sub">No recent activity yet.</div>
              </div>
            ) : (
              <div className="tc-activity">
                {(stats?.recentActivity ?? []).map((act, i) => (
                  <div className="tc-act-item" key={i}>
                    <div className="tc-act-dot" />
                    <div className="tc-act-body">
                      <div className="tc-act-title">
                        <strong>#{act.ticketId}</strong> — {act.title}
                      </div>
                      <div className="tc-act-time">{timeAgo(act.updatedAt)}</div>
                      <div className="tc-act-badge">
                        <span className={`tc-badge tc-badge-${act.status}`}>{fmtStatus(act.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Quick Links ───────────────────────────────────── */}
      <div>
        <div className="tc-eyebrow" style={{ marginBottom: 12 }}>Quick Actions</div>
        <div className="tc-quicklinks">
          <Link to="/technician/tickets" className="tc-ql">
            <div className="tc-ql-icon">{Icons.list}</div>
            View All Tickets
          </Link>
          <Link to="/technician/performance" className="tc-ql">
            <div className="tc-ql-icon">{Icons.chart}</div>
            My Performance
          </Link>
        </div>
      </div>

    </div>
  );
}
