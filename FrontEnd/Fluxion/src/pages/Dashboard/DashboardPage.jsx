import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './DashboardPage.css';

/* ── Animated counter ────────────────────────────────────── */
function AnimVal({ val, suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 1200;
    const t0 = performance.now();
    const end = val;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(ease * end) + suffix;
      if (p < 1) frame = requestAnimationFrame(step);
    }
    const timer = setTimeout(() => { frame = requestAnimationFrame(step); }, 300);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [val, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ── Helpers ──────────────────────────────────────────────── */
function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Bar chart data (static placeholder) ─────────────────── */
const MONTHS_COST = [
  { month: 'Aug', pct: 52 },
  { month: 'Sep', pct: 68 },
  { month: 'Oct', pct: 44 },
  { month: 'Nov', pct: 78 },
  { month: 'Dec', pct: 55 },
  { month: 'Jan', pct: 40 },
  { month: 'Feb', pct: 88, current: true },
];

/* ── Donut segments (static placeholder) ─────────────────── */
const DONUT_DATA = [
  { name: 'Laptops', pct: 46, count: 114, color: 'var(--db-blue)' },
  { name: 'Printers', pct: 19, count: 47, color: 'var(--db-green)' },
  { name: 'Vehicles', pct: 15, count: 37, color: 'var(--db-rust)' },
  { name: 'Other', pct: 20, count: 50, color: 'var(--db-amber)' },
];

/* ── Tickets placeholder ─────────────────────────────────── */
const TICKETS = [
  { asset: 'MacBook Pro M3', dept: 'IT Dept', issue: 'Screen flicker on startup', status: 'open', statusLabel: 'Open', priority: 'crit', priorityLabel: 'Critical', age: '2d' },
  { asset: 'Canon iR2625', dept: 'Finance', issue: 'Paper jam — tray 2', status: 'prog', statusLabel: 'In Progress', priority: 'med', priorityLabel: 'Medium', age: '1d' },
  { asset: 'Toyota Hilux GR', dept: 'Logistics', issue: 'Scheduled oil change due', status: 'wait', statusLabel: 'Waiting Parts', priority: 'high', priorityLabel: 'High', age: '4d' },
  { asset: 'Dell UltraSharp 27"', dept: 'Design', issue: 'Dead pixels — centre area', status: 'open', statusLabel: 'Open', priority: 'med', priorityLabel: 'Medium', age: '6h' },
  { asset: 'Cisco IP Phone', dept: 'Reception', issue: 'No dial tone intermittent', status: 'prog', statusLabel: 'In Progress', priority: 'low', priorityLabel: 'Low', age: '3d' },
];

/* ── Recent assets placeholder ───────────────────────────── */
const RECENT_ASSETS = [
  { emoji: '💻', name: 'MacBook Air M2', meta: 'IT · SN: C02XF8K5JGH5', badge: 'done', badgeLabel: 'Active' },
  { emoji: '🖨️', name: 'HP LaserJet Pro', meta: 'Finance · SN: CNBKC27943', badge: 'done', badgeLabel: 'Active' },
  { emoji: '🚗', name: 'Toyota Prius 2024', meta: 'Logistics · LPR: WP-4821', badge: 'prog', badgeLabel: 'Assigned' },
  { emoji: '📱', name: 'iPad Pro 12.9"', meta: 'Sales · SN: DMPXK84LQ1GN', badge: 'done', badgeLabel: 'Active' },
  { emoji: '🖥️', name: 'Dell XPS 15 9530', meta: 'Engineering · SN: 8FGT9X3', badge: 'open', badgeLabel: 'Maintenance' },
];

/* ── Team placeholder ────────────────────────────────────── */
const TEAM_MEMBERS = [
  { initials: 'AK', name: 'Ali Khan', role: 'Admin', color: '#2A6FC8', online: true },
  { initials: 'SR', name: 'Sara Ramos', role: 'Technician', color: '#2D9456', online: true },
  { initials: 'TN', name: 'Tom Ng', role: 'Admin', color: '#7B5EA7', online: false },
  { initials: 'MW', name: 'Maya W.', role: 'Technician', color: '#C84B2F', online: true },
  { initials: 'PL', name: 'Paul Lee', role: 'User', color: '#E8960A', online: false },
  { initials: 'EF', name: 'Eva F.', role: 'User', color: '#546E7A', online: true },
];

/* ── Department bars ─────────────────────────────────────── */
const DEPARTMENTS = [
  { name: 'Information Technology', used: 84, total: 100, color: 'var(--db-blue)' },
  { name: 'Logistics', used: 56, total: 80, color: 'var(--db-amber)' },
  { name: 'Finance', used: 38, total: 60, color: 'var(--db-green)' },
  { name: 'Human Resources', used: 22, total: 40, color: 'var(--db-rust)' },
  { name: 'Design & Creative', used: 28, total: 40, color: '#7B5EA7' },
  { name: 'Unassigned', used: 20, total: null, color: 'rgba(255,255,255,.2)' },
];

/* ── Activity feed placeholder ───────────────────────────── */
const ACTIVITY = [
  { icon: '✅', bg: 'rgba(45,148,86,.15)', text: <>Ticket <strong>#T-0042</strong> closed by Sara Ramos</>, time: '14 min ago' },
  { icon: '👤', bg: 'rgba(42,111,200,.15)', text: <><strong>Kai Patel</strong> was added as a Technician</>, time: '1h ago' },
  { icon: '🎫', bg: 'rgba(200,75,47,.15)', text: <>New ticket <strong>#T-0047</strong> raised by Paul Lee</>, time: '2h ago' },
  { icon: '🔄', bg: 'rgba(232,150,10,.15)', text: <><strong>MacBook Air M2</strong> assigned to Eva F.</>, time: '3h ago' },
];

/* ── Warranty alerts placeholder ─────────────────────────── */
const WARRANTIES = [
  { icon: '🚨', name: 'HP ProBook 450', days: 7, cls: 'crit' },
  { icon: '⚠️', name: 'Canon iR2625', days: 23, cls: 'warn' },
  { icon: '⚠️', name: 'Toyota Hilux', days: 31, cls: 'warn' },
  { icon: '✅', name: 'MacBook Pro M3', days: 142, cls: 'ok' },
];

/* ── SVG Icons ───────────────────────────────────────────── */
const SearchIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l3 3"/></svg>;
const ExportIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 10H2l2-6h8l2 6zM8 13a1 1 0 100-2 1 1 0 000 2z"/></svg>;
const PlusIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 1v14M1 8h14"/></svg>;
const BellIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 015 5v3l1.5 2.5H.5L2 9V6a6 6 0 016-5z"/><path d="M6 13a2 2 0 004 0"/></svg>;
const ArrowIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>;

/* ████████████████████████████████████████████████████████████ */
export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const barRefs = useRef([]);
  const deptRefs = useRef([]);

  const rawName = user?.email?.split('@')[0] || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  /* ── Format date ───────────────────────────────────────── */
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  /* ── Fetch data ────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes] = await Promise.allSettled([api.get('/User')]);
      if (usersRes.status === 'fulfilled') {
        const all = usersRes.value.data;
        setOrgData({
          totalUsers: all.length,
          activeUsers: all.filter(u => u.isActive).length,
        });
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Animate bars on mount ─────────────────────────────── */
  useEffect(() => {
    if (loading) return;
    const timers = [];
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const h = bar.dataset.h;
      bar.style.height = '0%';
      timers.push(setTimeout(() => {
        bar.style.transition = 'height .7s cubic-bezier(.34,1,.64,1)';
        bar.style.height = h + '%';
      }, 400 + i * 80));
    });
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const timers = [];
    deptRefs.current.forEach((fill, i) => {
      if (!fill) return;
      const w = fill.dataset.w;
      fill.style.width = '0%';
      timers.push(setTimeout(() => {
        fill.style.transition = 'width .8s cubic-bezier(.34,1,.64,1)';
        fill.style.width = w + '%';
      }, 600 + i * 100));
    });
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  /* ── KPI data ──────────────────────────────────────────── */
  const kpis = [
    { color: 'blue', emoji: '💻', label: 'Total Assets', val: 248, delta: '↑ 12', deltaCls: 'up', sub: 'this month' },
    { color: 'rust', emoji: '🎫', label: 'Open Tickets', val: 12, delta: '↑ 3', deltaCls: 'down', sub: 'vs last week' },
    { color: 'amber', emoji: '🔧', label: 'Under Maintenance', val: 7, delta: '↓ 2', deltaCls: 'up', sub: 'resolved today' },
    { color: 'green', emoji: '👥', label: 'Active Users', val: orgData?.activeUsers ?? 17, delta: '↑ 2', deltaCls: 'up', sub: 'added this week' },
  ];

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner" />
      <span>Loading dashboard…</span>
    </div>
  );

  /* ── Donut gradient ────────────────────────────────────── */
  const donutGradient = `conic-gradient(var(--db-blue) 0% 46%, var(--db-green) 46% 65%, var(--db-rust) 65% 80%, var(--db-amber) 80% 100%)`;

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="page db-page">

      {/* ── Topbar ───────────────────────────────────────── */}
      <header className="db-topbar">
        <div className="db-topbar-left">
          <h1 className="db-topbar-title">Owner Dashboard</h1>
          <p className="db-topbar-date">{today} · Acme Corporation</p>
        </div>
        <div className="db-topbar-right">
          <button className="db-tb-btn db-tb-ghost"><SearchIcon /> Search</button>
          <button className="db-tb-btn db-tb-ghost"><ExportIcon /> Export</button>
          <button className="db-tb-btn db-tb-primary"><PlusIcon /> Add Asset</button>
          <button className="db-tb-notif">
            <BellIcon />
            <span className="db-tb-notif-dot" />
          </button>
        </div>
      </header>

      {/* ── Greeting ─────────────────────────────────────── */}
      <div className="db-greeting">
        <div className="db-greeting-text">
          <h2>{greetingText()}, <em>{userName}.</em></h2>
          <p>Here's what's happening across your organisation today.</p>
        </div>
        <div className="db-greeting-meta">
          <div className="db-gm-item">
            <div className="db-gm-label">Open Tickets</div>
            <div className="db-gm-value" style={{ color: 'var(--db-rust)' }}>12</div>
          </div>
          <div className="db-gm-item">
            <div className="db-gm-label">Overdue</div>
            <div className="db-gm-value" style={{ color: 'var(--db-amber)' }}>3</div>
          </div>
          <div className="db-gm-item">
            <div className="db-gm-label">Expiring Soon</div>
            <div className="db-gm-value" style={{ color: 'var(--db-mist)' }}>5</div>
          </div>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="db-kpi-grid">
        {kpis.map((k, i) => (
          <div className={`db-kpi db-kpi-${k.color}`} key={i} style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
            <div className="db-kpi-icon">{k.emoji}</div>
            <div className="db-kpi-label">{k.label}</div>
            <div className="db-kpi-value"><AnimVal val={k.val} /></div>
            <div className="db-kpi-sub">
              <span className={`db-kpi-delta db-delta-${k.deltaCls}`}>{k.delta}</span> {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Bar Chart + Donut ─────────────────────── */}
      <div className="db-row db-row-3-2 db-d5">
        {/* Monthly Maintenance Cost */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Monthly Maintenance Cost</span>
            <button className="db-panel-action">View report →</button>
          </div>
          <div className="db-panel-body">
            <div className="db-cost-header">
              <div>
                <div className="db-cost-label">YTD Total</div>
                <div className="db-cost-big">$14,820</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="db-cost-label">This month</div>
                <div className="db-cost-month">$2,340</div>
              </div>
            </div>
            <div className="db-bar-chart">
              {MONTHS_COST.map((m, i) => (
                <div className="db-bar-col" key={i}>
                  <div className="db-bar-wrap">
                    <div
                      className={`db-bar-fill ${m.current ? 'current' : 'dim'}`}
                      ref={el => barRefs.current[i] = el}
                      data-h={m.pct}
                    />
                  </div>
                  <div className={`db-bar-month ${m.current ? 'active' : ''}`}>{m.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset Breakdown Donut */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Asset Breakdown</span>
            <button className="db-panel-action">All assets →</button>
          </div>
          <div className="db-panel-body">
            <div className="db-donut-wrap">
              <div className="db-donut" style={{ background: donutGradient }}>
                <div className="db-donut-centre">
                  <div className="db-donut-num">248</div>
                  <div className="db-donut-lbl">Total</div>
                </div>
              </div>
              <div className="db-donut-legend">
                {DONUT_DATA.map((d, i) => (
                  <div className="db-legend-item" key={i}>
                    <div className="db-legend-dot" style={{ background: d.color }} />
                    <div className="db-legend-name">{d.name}</div>
                    <div className="db-legend-pct">{d.pct}%</div>
                    <div className="db-legend-count">{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Tickets + Recent Assets ───────────────── */}
      <div className="db-row db-row-3-2 db-d6">
        {/* Tickets table */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Open Maintenance Tickets</span>
            <button className="db-panel-action">All tickets →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <table className="db-ticket-table">
              <thead>
                <tr>
                  <th>Asset / Dept</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Age</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div className="db-t-asset">{t.asset}</div>
                      <div className="db-t-dept">{t.dept}</div>
                    </td>
                    <td><div className="db-t-issue">{t.issue}</div></td>
                    <td><span className={`db-badge db-badge-${t.status}`}>{t.statusLabel}</span></td>
                    <td><span className={`db-priority db-priority-${t.priority}`}>{t.priorityLabel}</span></td>
                    <td className="db-t-age">{t.age}</td>
                    <td><button className="db-t-action"><ArrowIcon /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Added Assets */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Recently Added Assets</span>
            <button className="db-panel-action">All assets →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <div className="db-asset-list">
              {RECENT_ASSETS.map((a, i) => (
                <div className="db-asset-item" key={i}>
                  <div className="db-asset-thumb">{a.emoji}</div>
                  <div className="db-asset-info">
                    <div className="db-asset-name">{a.name}</div>
                    <div className="db-asset-meta">{a.meta}</div>
                  </div>
                  <span className={`db-badge db-badge-${a.badge}`}>{a.badgeLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Team + Departments + Activity/Warranty ── */}
      <div className="db-row db-row-3 db-d7">
        {/* Team */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Team</span>
            <button className="db-panel-action">Manage users →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 12 }}>
            <div className="db-team-grid">
              {TEAM_MEMBERS.map((m, i) => (
                <div className="db-member" key={i}>
                  <div className="db-m-avatar" style={{ background: m.color }}>{m.initials}</div>
                  <div>
                    <div className="db-m-name">{m.name}</div>
                    <div className="db-m-role">{m.role}</div>
                  </div>
                  <div className={`db-m-status ${m.online ? 'on' : 'off'}`} />
                </div>
              ))}
            </div>
            <div className="db-plan-usage">
              <div className="db-plan-label">Plan usage</div>
              <div className="db-plan-track">
                <div className="db-plan-fill" style={{ width: '68%' }} />
              </div>
              <div className="db-plan-nums">
                <span>{orgData?.totalUsers ?? 17} of 25 seats used</span>
                <span style={{ color: 'var(--db-text)' }}>68%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Usage */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Assets by Department</span>
            <button className="db-panel-action">Departments →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 14 }}>
            <div className="db-dept-bars">
              {DEPARTMENTS.map((d, i) => (
                <div className="db-dept-row" key={i}>
                  <div className="db-dept-meta">
                    <span className="db-dept-name">{d.name}</span>
                    <span className="db-dept-nums">{d.used} / {d.total ?? '—'}</span>
                  </div>
                  <div className="db-dept-track">
                    <div
                      className="db-dept-fill"
                      ref={el => deptRefs.current[i] = el}
                      data-w={d.total ? Math.round((d.used / d.total) * 100) : 20}
                      style={{ background: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity + Warranty col */}
        <div className="db-stacked-col">
          {/* Activity Feed */}
          <div className="db-panel db-panel-flex">
            <div className="db-panel-head">
              <span className="db-panel-title">Recent Activity</span>
              <button className="db-panel-action">View all →</button>
            </div>
            <div className="db-panel-body" style={{ paddingTop: 8 }}>
              <div className="db-activity">
                {ACTIVITY.map((a, i) => (
                  <div className="db-act-item" key={i}>
                    <div className="db-act-icon" style={{ background: a.bg }}>{a.icon}</div>
                    <div className="db-act-body">
                      <div className="db-act-text">{a.text}</div>
                      <div className="db-act-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warranty Alerts */}
          <div className="db-panel">
            <div className="db-panel-head">
              <span className="db-panel-title">Warranty Expiry</span>
              <button className="db-panel-action">Full report →</button>
            </div>
            <div className="db-panel-body" style={{ paddingTop: 8 }}>
              <div className="db-warranty-list">
                {WARRANTIES.map((w, i) => (
                  <div className="db-w-item" key={i}>
                    <div className="db-w-icon">{w.icon}</div>
                    <div className="db-w-name">{w.name}</div>
                    <span className={`db-w-days db-w-${w.cls}`}>{w.days} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
