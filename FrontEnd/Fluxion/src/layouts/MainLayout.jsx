import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './MainLayout.css';

/* ── SVG icon helpers ──────────────────────────────────── */
const I = {
  welcome: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6.5L8 2l6 4.5V14H2V6.5z" /><rect x="6" y="10" width="4" height="4" rx=".5" /></svg>,
  dashboard: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>,
  users: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5" /><circle cx="12" cy="5" r="2" /><path d="M11.5 9.5c1.5.1 3 1.3 3.5 3.5" /></svg>,
  invite: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M10 9l2 2 3-3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  roles: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="10" rx="1.5" /><path d="M4 4V3a2 2 0 014 0v1M10 4V3a2 2 0 014 0v1" /><path d="M4 9h8M4 12h5" /></svg>,
  department: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="7" width="4" height="7" rx="1" /><rect x="6" y="4" width="4" height="10" rx="1" /><rect x="11" y="1" width="4" height="13" rx="1" /></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1v14M1 8h14" /></svg>,
  asset: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="9" rx="1" /><path d="M5 12v2M11 12v2M3 14h10" /></svg>,
  assignment: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12l-1 8H3L2 4zM5 4V2h6v2" /><path d="M6 8h4" /></svg>,
  qr: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="10" height="10" rx="1" /><path d="M7 6h2M6 9h4M8 3V1M8 15v-2M3 8H1M15 8h-2" /></svg>,
  category: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h14M1 9h14M5 1v14M11 1v14" /><rect x="1" y="1" width="14" height="14" rx="1" /></svg>,
  ticket: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7" /><path d="M8 4v4l3 2" /></svg>,
  raise: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 10l-3.7 2.5 1.4-4.3L2 5.5h4.5z" /></svg>,
  log: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="14" height="14" rx="2" /><path d="M4 8h8M4 5h8M4 11h5" /></svg>,
  overdue: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v5l3 3" /><circle cx="8" cy="8" r="7" /></svg>,
  report: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 14V5l5-4 5 4v9" /><path d="M6 14v-4h4v4" /></svg>,
  chart: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3" /><rect x="1" y="1" width="14" height="14" rx="1.5" /></svg>,
  warranty: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8h14M8 1v14M3 3l10 10M13 3L3 13" /></svg>,
  exportData: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" /><path d="M5 4V2h6v2M6 8h4M6 11h2" /></svg>,
  globe: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7" /><path d="M8 1v14M2 5.5h12M2 10.5h12" /></svg>,
  audit: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="1" /><path d="M5 5h6M5 8h6M5 11h3" /></svg>,
  settings: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" /></svg>,
  support: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3" /><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M13 2l2 2-6 6-2-1" /></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M11 11l3 3" /></svg>,
  bell: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 015 5v3l1.5 2.5H.5L2 9V6a6 6 0 016-5z" /><path d="M6 13a2 2 0 004 0" /></svg>,
  gear: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" /></svg>,
};

/* ── Sidebar data ──────────────────────────────────────── */
/* ownerOnly: true → hidden from employees (role "user") */
const NAV = [
  {
    label: 'Home', items: [
      { to: '/welcome', icon: I.welcome, text: 'Welcome' },
      { to: '/dashboard', icon: I.dashboard, text: 'Dashboard' },
    ]
  },
  {
    label: 'People', ownerOnly: true, items: [
      { to: '/users', icon: I.users, text: 'Users' },
      { to: '/invite-users', icon: I.invite, text: 'Invite Users' },
      { to: '/roles', icon: I.roles, text: 'Roles & Access' },
    ]
  },
  {
    label: 'Departments', items: [
      { to: '/departments', icon: I.department, text: 'All Departments' },
      { to: '/add-department', icon: I.plus, text: 'Add Department', ownerOnly: true },
    ]
  },
  {
    label: 'Assets', items: [
      { to: '/assets', icon: I.asset, text: 'All Assets' },
      { to: '/register-asset', icon: I.plus, text: 'Register Asset', ownerOnly: true },
      { to: '/assignments', icon: I.assignment, text: 'Asset Assignments', ownerOnly: true },
      { to: '/assigned-assets', icon: I.assignment, text: 'Assigned Assets', userOnly: true },
      { to: '/qr-labels', icon: I.qr, text: 'QR Code Labels' },
      { to: '/asset-categories', icon: I.category, text: 'Asset Categories', ownerOnly: true },
    ]
  },
  {
    label: 'Maintenance', items: [
      { to: '/tickets', icon: I.ticket, text: 'All Tickets' },
      { to: '/raise-ticket', icon: I.raise, text: 'Raise Ticket' },
      { to: '/maintenance-logs', icon: I.log, text: 'Maintenance Logs' },
      { to: '/overdue-tickets', icon: I.overdue, text: 'Overdue Tickets' },
    ]
  },
  {
    label: 'Reports', ownerOnly: true, items: [
      { to: '/report-assets', icon: I.report, text: 'Asset Register' },
      { to: '/report-maintenance', icon: I.chart, text: 'Maintenance Cost' },
      { to: '/report-warranty', icon: I.warranty, text: 'Warranty Expiry' },
      { to: '/export-data', icon: I.exportData, text: 'Export Data' },
    ]
  },
  {
    label: 'Organisation', ownerOnly: true, items: [
      { to: '/subscription', icon: I.globe, text: 'Subscription' },
      { to: '/audit-log', icon: I.audit, text: 'Audit Log' },
      { to: '/settings', icon: I.settings, text: 'Settings' },
      { to: '/support', icon: I.support, text: 'Support' },
    ]
  },
];

/* ── Breadcrumb helper ─────────────────────────────────── */
const pageName = (path) => {
  for (const g of NAV) for (const i of g.items) if (i.to === path) return i.text;
  return 'Page';
};

/* ── Filter nav by role ────────────────────────────────── */
function getFilteredNav(role) {
  const isOwner = role === 'owner' || role === 'systemAdmin';
  const isEmployee = role === 'user';
  return NAV
    .filter(g => (!g.ownerOnly || isOwner) && (!g.userOnly || isEmployee))
    .map(g => ({
      ...g,
      items: g.items.filter(i => (!i.ownerOnly || isOwner) && (!i.userOnly || isEmployee))
    }))
    .filter(g => g.items.length > 0);
}

/* ██████████████████████████████████████████████████████████ */
export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [clock, setClock] = useState('');

  const rawName = user?.email?.split('@')[0] || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const userRole = user?.role || 'user';
  const initials = userName.slice(0, 2).toUpperCase();
  const filteredNav = useMemo(() => getFilteredNav(userRole), [userRole]);

  /* Live clock */
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''));
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ml-shell">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="ml-sidebar">

        {/* Logo */}
        <Link to="/" className="ml-sb-logo" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: '#FFFFFF', letterSpacing: '1px' }}>FLUXION</span>
        </Link>

        {/* Org pill */}
        <div className="ml-sb-org">
          <span className="ml-org-dot" />
          <div className="ml-org-info">
            <div className="ml-org-name">{user?.orgId ? `Organisation` : 'My Workspace'}</div>
            <div className="ml-org-plan">Pro Plan · Active</div>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="ml-sb-scroll">
          {filteredNav.map((group) => (
            <div key={group.label}>
              <span className="ml-sb-label">{group.label}</span>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `ml-sb-link${isActive ? ' active' : ''}`}>
                  {item.icon}
                  {item.text}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Subscription block */}
        <div className="ml-sb-plan">
          <div className="ml-spb-top">
            <span className="ml-spb-name">Pro Plan</span>
            <span className="ml-spb-badge">Active</span>
          </div>
          <div className="ml-spb-bar"><div className="ml-spb-fill" /></div>
          <div className="ml-spb-nums"><span>Users · —</span><span>Assets · —</span></div>
          <button className="ml-spb-up">↑ Upgrade to Enterprise</button>
        </div>

        {/* Profile */}
        <div className="ml-sb-profile">
          <div className="ml-sb-av">{initials}</div>
          <div className="ml-sb-uinfo">
            <div className="ml-sb-uname">{userName}</div>
            <div className="ml-sb-urole">{userRole}</div>
          </div>
          <button className="ml-sb-gear" onClick={logout} title="Logout">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 12l4-4-4-4M15 8H6" /></svg>
          </button>
        </div>

      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="ml-main">

        {/* Topbar */}
        <header className="ml-topbar">
          <div className="ml-tb-left">
            <span className="ml-tb-crumb">Fluxion</span>
            <span className="ml-tb-sep">›</span>
            <span className="ml-tb-page">{pageName(location.pathname)}</span>
          </div>
          <div className="ml-tb-right">
            <span className="ml-tb-clock">{clock}</span>
            <button className="ml-tb-btn">
              {I.search}
              Search
            </button>
            <button className="ml-tb-notif">
              {I.bell}
              <span className="ml-tb-nd" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="ml-content">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
