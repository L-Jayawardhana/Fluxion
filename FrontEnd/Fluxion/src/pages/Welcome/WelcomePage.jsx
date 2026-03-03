import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GrowingGraph from '../../components/GrowingGraph';
import RegisterAssetsGraphic from '../../components/RegisterAssetsGraphic';
import InviteTeamGraphic from '../../components/InviteTeamGraphic';
import AssignAssetsGraphic from '../../components/AssignAssetsGraphic';
import './WelcomePage.css';

/* ── SVG icon helpers ─────────────────────────────────────── */
const IC = {
  department: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="9" width="5" height="8" rx="1" /><rect x="7.5" y="5" width="5" height="12" rx="1" /><rect x="13" y="2" width="5" height="15" rx="1" /></svg>,
  asset: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="4" width="14" height="10" rx="1.5" /><path d="M6 14v2M14 14v2M4 18h12" /></svg>,
  users: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="6" r="3" /><path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="14" cy="6" r="2.2" /><path d="M14 11c2.5 0 4.5 1.8 5 4" /></svg>,
  assign: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7 4h10l-1 10H8L7 4zM9 4V2h6v2" /><path d="M10 9h4" /></svg>,
  lightbulb: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M10 2a5 5 0 013 9v2H7v-2a5 5 0 013-9z" /><path d="M8 15h4M8.5 17h3" /></svg>,
  tag: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3h7l8 8-7 7-8-8V3z" /><circle cx="6" cy="7" r="1.5" fill="currentColor" /></svg>,
  wrench: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M14.5 2.5a4.5 4.5 0 00-5.2 7.2L4 15l1 1 5.3-5.3a4.5 4.5 0 007.2-5.2l-3 3-2-2 3-3z" /></svg>,
  clipboard: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="3" width="12" height="15" rx="1.5" /><path d="M7 3V2a1 1 0 011-1h4a1 1 0 011 1v1M7 8h6M7 11h6M7 14h3" /></svg>,
  shield: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M10 1l7 3v5c0 4.4-3 8-7 9.5C6 17.4 3 13.4 3 9V4l7-3z" /><path d="M7 10l2 2 4-4" /></svg>,
  chart: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="16" height="16" rx="2" /><path d="M5 14l3-4 3 2 4-6" /></svg>,
  chat: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3v-3H3a1 1 0 01-1-1V5a1 1 0 011-1z" /><path d="M6 8h8M6 11h5" /></svg>,
  keyboard: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="4" width="18" height="12" rx="2" /><path d="M5 8h1M9 8h2M14 8h1M5 11h1M8 11h4M14 11h1M7 14h6" /></svg>,
};

/* ── Data ────────────────────────────────────────────────── */
const WORKFLOWS = [
  {
    num: '01', icon: IC.department, graphic: <GrowingGraph />, accent: '#3B82F6',
    title: 'Set Up Departments',
    desc: 'Create your org\'s structure. Departments group your assets and users so everything stays organised by team or location.',
    steps: [
      'Go to <strong>Departments → Add Department</strong>',
      'Enter a name (e.g. "IT", "Logistics")',
      'Add a location if applicable',
      'Repeat for each team in your org',
    ],
    status: 'next', statusLabel: 'Start here →',
    btn: 'Add first department',
  },
  {
    num: '02', icon: IC.asset, graphic: <RegisterAssetsGraphic />, accent: '#22C55E',
    title: 'Register Your Assets',
    desc: 'Add every physical item your company owns — laptops, vehicles, printers, furniture. Each gets a unique QR code automatically.',
    steps: [
      'Go to <strong>Assets → Register Asset</strong>',
      'Fill in name, type, serial number, cost',
      'Assign it to a department',
      'System auto-generates a QR code label',
    ],
    status: 'todo', statusLabel: 'Pending',
    btn: 'Register first asset',
  },
  {
    num: '03', icon: IC.users, graphic: <InviteTeamGraphic />, accent: '#F59E0B',
    title: 'Invite Your Team',
    desc: 'Add Admins, Technicians, and Users. Each gets an email with their temp password and is guided to change it on first login.',
    steps: [
      'Go to <strong>Users → Invite User</strong>',
      'Enter email and select a role',
      'They receive secure login details',
      'You see their accept status live',
    ],
    status: 'todo', statusLabel: 'Pending',
    btn: 'Invite first user',
  },
  {
    num: '04', icon: IC.assign, graphic: <AssignAssetsGraphic />, accent: '#8B5CF6',
    title: 'Assign Assets to Users',
    desc: 'Once assets and users are in the system, assign assets to the people using them. Full assignment history is kept automatically.',
    steps: [
      'Go to <strong>Assets → Asset Assignments</strong>',
      'Select an asset and a user',
      'Add an assignment date and optional notes',
      'User can now see this asset in their dashboard',
    ],
    status: 'todo', statusLabel: 'Pending',
    btn: 'Assign an asset',
  },
];

const SUGGESTIONS = [
  { icon: IC.lightbulb, bg: 'rgba(59,130,246,.1)', label: 'Quick win', title: 'Add your IT department first', desc: 'IT typically owns the most trackable assets (laptops, monitors, peripherals). Start there for the biggest immediate impact on visibility.' },
  { icon: IC.tag, bg: 'rgba(34,197,94,.1)', label: 'Asset tip', title: 'Print QR labels immediately', desc: 'After registering assets, print QR labels and attach them physically. This makes scanning-based lookups and ticket-raising instant in the field.' },
  { icon: IC.wrench, bg: 'rgba(245,158,11,.1)', label: 'Team tip', title: 'Add a Technician early', desc: 'Invite at least one Technician before registering assets. When you raise your first maintenance ticket, you\'ll need someone to assign it to.' },
  { icon: IC.clipboard, bg: 'rgba(99,102,241,.1)', label: 'Organisation tip', title: 'Record purchase dates & costs', desc: 'Filling in purchase date, warranty end date, and cost when registering assets unlocks the maintenance cost and warranty expiry reports later.' },
  { icon: IC.shield, bg: 'rgba(124,58,237,.1)', label: 'Security tip', title: 'Add an Admin before you travel', desc: 'As Owner, you\'re the only one who can manage the subscription. Add at least one Admin so the org can keep running if you\'re unavailable.' },
  { icon: IC.chart, bg: 'rgba(255,255,255,.05)', label: 'Reporting tip', title: 'Run your first report after 30 days', desc: 'Once you\'ve logged maintenance for a month, the Maintenance Cost report gives you a breakdown of repair spend by asset, department, and technician.' },
];

const TIPS = [
  { title: 'You can add a user to multiple departments', desc: 'Go to Users → edit a user → assign them to multiple departments. Useful for managers who oversee more than one team.', tag: 'Users', color: '#3B82F6' },
  { title: 'Asset status updates automatically', desc: 'When you assign an asset, its status changes to "Assigned". When a maintenance ticket is opened, it changes to "Under Maintenance". No manual updates needed.', tag: 'Assets', color: '#22C55E' },
  { title: 'Closing a ticket auto-creates a maintenance log', desc: 'When a technician closes a ticket, the system automatically creates an immutable maintenance log with the repair date, cost, and notes.', tag: 'Maintenance', color: '#6366F1' },
  { title: 'Retired assets stay in your history', desc: 'When you retire an asset, it\'s soft-deleted — it stays in your maintenance logs and cost reports forever. Nothing is lost for audit purposes.', tag: 'Assets', color: '#F59E0B' },
  { title: 'Export any report as PDF or CSV', desc: 'Every report (Asset Register, Maintenance Cost, Warranty Expiry) has a one-click export button. Great for insurance, audits, and board presentations.', tag: 'Reports', color: '#7C3AED' },
  { title: 'The subscription page shows your live limits', desc: 'Go to Organisation → Subscription to see how many user seats and asset slots you\'ve used vs your plan limit. Upgrade from there if needed.', tag: 'Subscription', color: '#8B8FA3' },
];

const SHORTCUTS = [
  { action: 'Global search', keys: ['Ctrl', 'K'] },
  { action: 'New asset', keys: ['N', 'A'] },
  { action: 'New ticket', keys: ['N', 'T'] },
  { action: 'Invite user', keys: ['N', 'U'] },
  { action: 'Go to dashboard', keys: ['G', 'D'] },
  { action: 'Go to assets', keys: ['G', 'A'] },
  { action: 'Go to tickets', keys: ['G', 'T'] },
  { action: 'Go to reports', keys: ['G', 'R'] },
  { action: 'Go to users', keys: ['G', 'U'] },
  { action: 'Export current view', keys: ['Ctrl', 'E'] },
  { action: 'Toggle sidebar', keys: ['Ctrl', '\\'] },
  { action: 'Help & docs', keys: ['?'] },
];

/* ████████████████████████████████████████████████████████████ */
export default function WelcomePage() {
  const { user } = useAuth();
  const ringRef = useRef(null);

  const rawName = user?.email?.split('@')[0] || 'there';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const userRole = user?.role || 'User';

  /* Progress ring animation (1 of 4 = 25% done) */
  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.style.transition = 'stroke-dashoffset 1s ease';
      el.style.strokeDashoffset = '118'; /* 75% of 157 = 3/4 remaining */
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page wl-page">

      {/* ═══════════ HEADER LOGO ═══════════ */}
      <div className="wl-header">
        <Link to="/" className="wl-logo">
          <img src="/LOGOblack.png" alt="FLUXION" className="wl-logo-img" />
          FLUXION
        </Link>
      </div>

      {/* ═══════════ WELCOME HERO ═══════════ */}
      <section className="wl-hero">
        <div className="wl-hero-accent" />
        <div className="wl-hero-bg">WELCOME</div>
        <div className="wl-hero-top">
          <div className="wl-hero-left">
            <div className="wl-eyebrow"><span className="wl-ey-line" />First time here</div>
            <h1 className="wl-title">Welcome to Fluxion, <em>{userName}.</em></h1>
            <p className="wl-sub">
              Your organisation workspace is ready. This guide will walk you through the key
              workflows — from registering your first asset to managing maintenance tickets.
              Follow the steps below to get fully set up.
            </p>
          </div>
          <div className="wl-meta">
            <div className="wl-meta-item">
              <span className="wl-meta-dot" style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <span className="wl-meta-label">Status</span>
              <span className="wl-meta-val">Active Session</span>
            </div>
            <div className="wl-meta-item">
              <span className="wl-meta-dot" style={{ background: '#F59E0B' }} />
              <span className="wl-meta-label">Role</span>
              <span className="wl-meta-val" style={{ textTransform: 'capitalize' }}>{userRole}</span>
            </div>
            <div className="wl-meta-item">
              <span className="wl-meta-dot" style={{ background: '#3B82F6' }} />
              <span className="wl-meta-label">Account</span>
              <span className="wl-meta-val">{user?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="wl-progress">
          <div className="wl-ring-wrap">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle className="wl-pr-track" cx="28" cy="28" r="25" />
              <circle className="wl-pr-fill" cx="28" cy="28" r="25" ref={ringRef} />
            </svg>
            <div className="wl-pr-label">1/4</div>
          </div>
          <div className="wl-pr-body">
            <div className="wl-pr-title">Setup progress — 1 of 4 steps complete</div>
            <div className="wl-pr-sub">You've created your account. Complete the remaining steps to get your workspace fully operational.</div>
            <div className="wl-pr-steps">
              <div className="wl-pr-step done" title="Account created" />
              <div className="wl-pr-step" title="Add departments" />
              <div className="wl-pr-step" title="Register first asset" />
              <div className="wl-pr-step" title="Invite your team" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WORKFLOWS ═══════════ */}
      <div className="wl-section-head">
        <div>
          <div className="wl-sh-title">Getting Started — Follow These Workflows</div>
          <div className="wl-sh-sub">Complete each workflow in order for the smoothest setup experience</div>
        </div>
      </div>

      <div className="wl-workflow-grid">
        {WORKFLOWS.map((w, i) => (
          <div className={`wl-wf-card wl-wf-c${i + 1}`} key={i} style={{ '--wf-accent': w.accent, animationDelay: `${0.08 + i * 0.06}s` }}>
            <div className="wl-wf-num"><span className="wl-wf-numline" />Step {w.num}</div>
            <div className="wl-wf-emoji">{w.icon}</div>
            <div className="wl-wf-title">{w.title}</div>
            <div className="wl-wf-desc">{w.desc}</div>
            {w.graphic && (
              <div className="wl-wf-graphic" style={{
                width: '100%',
                aspectRatio: '1',
                overflow: 'hidden'
              }}>
                {w.graphic}
              </div>
            )}
            <ul className="wl-wf-steps">
              {w.steps.map((s, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ul>
            <div className="wl-wf-status-row">
              <span className={`wl-wf-status wl-wf-st-${w.status}`}>{w.statusLabel}</span>
            </div>
            <button className="wl-wf-btn">
              {w.btn}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* ═══════════ SUGGESTIONS ═══════════ */}
      <div className="wl-section-head">
        <div>
          <div className="wl-sh-title">What to Add First</div>
          <div className="wl-sh-sub">Recommended actions based on your org setup</div>
        </div>
      </div>

      <div className="wl-suggest-grid">
        {SUGGESTIONS.map((s, i) => (
          <div className="wl-sug-card" key={i} style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
            <div className="wl-sug-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="wl-sug-body">
              <div className="wl-sug-label">{s.label}</div>
              <div className="wl-sug-title">{s.title}</div>
              <div className="wl-sug-desc">{s.desc}</div>
            </div>
            <div className="wl-sug-arrow">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ TIPS & SHORTCUTS ═══════════ */}
      <div className="wl-section-head">
        <div>
          <div className="wl-sh-title">Tips &amp; Shortcuts</div>
          <div className="wl-sh-sub">Things that will save you time as you use Fluxion daily</div>
        </div>
      </div>

      <div className="wl-tips-row">

        {/* Tips panel */}
        <div className="wl-tips-panel">
          <div className="wl-tips-head">
            <span className="wl-tips-head-emoji">{IC.chat}</span>
            <span className="wl-tips-head-title">Tips for You</span>
            <span className="wl-tips-head-count">{TIPS.length} tips</span>
          </div>
          <div className="wl-tips-list">
            {TIPS.map((t, i) => (
              <div className="wl-tip-item" key={i}>
                <div className="wl-tip-num" style={{ background: t.color + '1A', color: t.color }}>{i + 1}</div>
                <div className="wl-tip-body">
                  <div className="wl-tip-title">{t.title}</div>
                  <div className="wl-tip-desc">{t.desc}</div>
                  <span className="wl-tip-tag">{t.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="wl-keys-panel">
          <div className="wl-keys-head">
            <span className="wl-keys-head-emoji">{IC.keyboard}</span>
            <span className="wl-keys-head-title">Keyboard Shortcuts</span>
          </div>
          <div className="wl-keys-list">
            {SHORTCUTS.map((s, i) => (
              <div className="wl-key-item" key={i}>
                <span className="wl-key-action">{s.action}</span>
                <div className="wl-key-combo">
                  {s.keys.map((k, j) => <span className="wl-key-k" key={j}>{k}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
