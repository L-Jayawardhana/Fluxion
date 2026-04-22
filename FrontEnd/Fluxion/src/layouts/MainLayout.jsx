import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../services/notificationService';
import { getPlan } from '../services/subscriptionService';
import { useAuth } from '../hooks/useAuth';
import GlobalSearch from '../components/GlobalSearch';
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
  support: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7" /><path d="M8 5a2 2 0 110 4" strokeLinecap="round" /><circle cx="8" cy="12" r=".5" fill="currentColor" /></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M11 11l3 3" /></svg>,
  bell: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1a5 5 0 015 5v3l1.5 2.5H.5L2 9V6a6 6 0 016-5z" /><path d="M6 13a2 2 0 004 0" /></svg>,
  gear: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" /></svg>,
  perf: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3"/><rect x="1" y="1" width="14" height="14" rx="1.5"/></svg>,
  wrench: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 2.5a4 4 0 00-5.4 5.4L2 12l2 2 4.1-4.1A4 4 0 0011.5 2.5z"/></svg>,
  menu: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h12M2 12h12"/></svg>,
};

/* ── Sidebar data ──────────────────────────────────────── */
const NAV = [
  {
    label: 'Home', items: [
      { to: '/welcome',       icon: I.welcome,    text: 'Welcome' },
      { to: '/dashboard',     icon: I.dashboard,  text: 'Dashboard',    ownerOnly: true },
      { to: '/notifications', icon: I.bell,       text: 'Notifications' },
    ]
  },
  {
    label: 'People', ownerOnly: true, items: [
      { to: '/users',         icon: I.users,  text: 'Users' },
      { to: '/invite-users',  icon: I.invite, text: 'Invite Users' },
      { to: '/roles',         icon: I.roles,  text: 'Roles & Access' },
    ]
  },
  {
    label: 'Departments', items: [
      { to: '/departments',     icon: I.department, text: 'All Departments', ownerOnly: true },
      { to: '/add-department',  icon: I.plus,       text: 'Add Department',  ownerOnly: true },
    ]
  },
  {
    label: 'Assets', items: [
      { to: '/assets',          icon: I.asset,      text: 'All Assets',         ownerOnly: true },
      { to: '/register-asset',  icon: I.plus,       text: 'Register Asset',     ownerOnly: true },
      { to: '/assignments',     icon: I.assignment, text: 'Asset Assignments',  ownerOnly: true },
      { to: '/assigned-assets', icon: I.assignment, text: 'Assigned Assets',    userOnly: true },
    ]
  },
  {
    label: 'Maintenance', items: [
      { to: '/tickets',           icon: I.ticket, text: 'All Tickets', ownerOnly: true },
      { to: '/raise-ticket',      icon: I.raise,  text: 'Raise Ticket' },
      { to: '/maintenance-logs',  icon: I.log,    text: 'Maintenance Logs' },
    ]
  },
  {
    label: 'Technician', technicianOnly: true, items: [
      { to: '/technician/dashboard',   icon: I.dashboard, text: 'Ticket Summary',  technicianOnly: true },
      { to: '/technician/tickets',     icon: I.ticket,    text: 'My Tickets',      technicianOnly: true },
      { to: '/technician/performance', icon: I.chart,     text: 'Performance',     technicianOnly: true },
    ]
  },
  {
    label: 'Reports', ownerOnly: true, items: [
      { to: '/report-maintenance-cost', icon: I.chart,    text: 'Maintenance Cost' },
      { to: '/report-warranty',         icon: I.warranty, text: 'Warranty Expiry' },
    ]
  },
  {
    label: 'Organisation', ownerOnly: true, items: [
      { to: '/settings', icon: I.settings, text: 'Settings' },
    ]
  },
  {
    label: 'Help', items: [
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
  const isOwner      = role === 'owner' || role === 'systemAdmin' || role === 'admin' || role === 'manager';
  const isEmployee   = role === 'user';
  const isTechnician = role === 'technician';
  return NAV
    .filter(g => {
      if (g.ownerOnly      && !isOwner)      return false;
      if (g.userOnly       && !isEmployee)   return false;
      if (g.technicianOnly && !isTechnician) return false;
      return true;
    })
    .map(g => ({
      ...g,
      items: g.items.filter(i => {
        if (i.ownerOnly      && !isOwner)      return false;
        if (i.userOnly       && !isEmployee)   return false;
        if (i.technicianOnly && !isTechnician) return false;
        return true;
      })
    }))
    .filter(g => g.items.length > 0);
}

/* ██████████████████████████████████████████████████████████ */
export default function MainLayout() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [clock,        setClock]        = useState('');
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [currentPlan,  setCurrentPlan]  = useState('Free');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  /* Sequence shortcut tracker: e.g. G then D */
  const seqRef   = useRef(null);
  const seqTimer = useRef(null);

  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const rawName  = user?.email?.split('@')[0] || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const userRole = user?.role || 'user';
  const initials = userName.slice(0, 2).toUpperCase();
  const filteredNav  = useMemo(() => getFilteredNav(userRole), [userRole]);
  const showPlanBlock = userRole !== 'user' && userRole !== 'technician';

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

  /* Unread notifications tracker */
  useEffect(() => {
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, [user, location.pathname]);

  /* Subscription plan tracker */
  useEffect(() => {
    if (user?.orgId && showPlanBlock) {
      getPlan(user.orgId)
        .then((res) => setCurrentPlan(res.planName))
        .catch((err) => console.error('Error fetching plan in layout:', err));
    }
    const handlePlanChange = (e) => { if (e.detail) setCurrentPlan(e.detail); };
    window.addEventListener('planChanged', handlePlanChange);
    return () => window.removeEventListener('planChanged', handlePlanChange);
  }, [user, showPlanBlock]);

  /* ── Global keyboard shortcuts ─────────────────────────── */
  useEffect(() => {
    const isAdmin = ['owner', 'admin', 'systemadmin', 'manager'].includes(userRole);
    const isTech  = userRole === 'technician';
    // const isUser  = userRole === 'user'; // used for future expansion

    const onKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;

      /* Ctrl+K — global search (always available) */
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        return;
      }

      /* Ctrl+\ — toggle sidebar (always available) */
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }

      if (inInput) return;

      /* ? — support/help (always available) */
      if (e.key === '?') {
        e.preventDefault();
        navigate('/support');
        return;
      }

      /* ── Role-specific two-key sequences ── */
      let SEQ = {};

      if (isAdmin) {
        SEQ = {
          'n+a': '/register-asset',   // New Asset
          'n+t': '/raise-ticket',     // New Ticket
          'n+u': '/invite-users',     // New User
          'g+d': '/dashboard',        // Go Dashboard
          'g+a': '/assets',           // Go Assets
          'g+t': '/tickets',          // Go Tickets
          'g+u': '/users',            // Go Users
        };
      } else if (isTech) {
        SEQ = {
          'g+d': '/technician/dashboard', // Go Dashboard (tech)
          'g+t': '/technician/tickets',   // Go My Tickets
          'n+t': '/raise-ticket',         // New Ticket
        };
      } else {
        // Regular user
        SEQ = {
          'g+t': '/tickets',           // Go Tickets
          'n+t': '/raise-ticket',      // New Ticket
          'g+a': '/assigned-assets',   // Go Assigned Assets
        };
      }

      const k = e.key.toLowerCase();
      if (seqRef.current) {
        const combo = `${seqRef.current}+${k}`;
        if (SEQ[combo]) {
          e.preventDefault();
          navigate(SEQ[combo]);
        }
        seqRef.current = null;
        clearTimeout(seqTimer.current);
        return;

      }

      /* Record first key if it could start a combo */
      const firstKeys = new Set(['n', 'g']);
      if (firstKeys.has(k)) {
        seqRef.current = k;
        seqTimer.current = setTimeout(() => { seqRef.current = null; }, 1000);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(seqTimer.current);
    };
  }, [navigate, userRole]);

  let maxUsers  = '—';
  let maxAssets = '—';
  let nextPlan  = 'Enterprise';

  if (currentPlan === 'Free')       { maxUsers = '5';         maxAssets = '50';        nextPlan = 'Pro'; }
  else if (currentPlan === 'Pro')   { maxUsers = '25';        maxAssets = '500';       nextPlan = 'Enterprise'; }
  else if (currentPlan === 'Enterprise') { maxUsers = 'Unlimited'; maxAssets = 'Unlimited'; nextPlan = null; }

  return (
    <div className={`ml-shell${sidebarOpen ? '' : ' ml-sidebar-collapsed'}`}>

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
            <div className="ml-org-plan">{currentPlan} Plan · Active</div>
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
        {showPlanBlock && (
          <div className="ml-sb-plan">
            <div className="ml-spb-top">
              <span className="ml-spb-name">{currentPlan} Plan</span>
              <span className="ml-spb-badge">Active</span>
            </div>
            <div className="ml-spb-bar"><div className="ml-spb-fill" style={{ width: currentPlan === 'Enterprise' ? '100%' : '30%' }} /></div>
            <div className="ml-spb-nums">
              <span>Users · {maxUsers}</span>
              <span>Assets · {maxAssets}</span>
            </div>
            {nextPlan && (
              <button className="ml-spb-up" onClick={() => navigate('/settings')}>
                ↑ Upgrade to {nextPlan}
              </button>
            )}
          </div>
        )}

        {/* Profile */}
        <div className="ml-sb-profile">
          <div className="ml-sb-av">{initials}</div>
          <div className="ml-sb-uinfo">
            <div className="ml-sb-uname">{userName}</div>
            <div className="ml-sb-urole">{userRole === 'owner' ? 'admin' : userRole}</div>
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
            <button
              className="ml-tb-sidebar-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              title="Toggle sidebar (Ctrl+\)"
            >
              {I.menu}
            </button>
            <span className="ml-tb-crumb">Fluxion</span>
            <span className="ml-tb-sep">›</span>
            <span className="ml-tb-page">{pageName(location.pathname)}</span>
          </div>
          <div className="ml-tb-right">
            <span className="ml-tb-clock">{clock}</span>
            <button
              className="ml-tb-btn"
              onClick={openSearch}
              title="Search (Ctrl+K)"
              id="topbar-search-btn"
            >
              {I.search}
              Search
              <span className="ml-tb-shortcut">Ctrl K</span>
            </button>
            <button className="ml-tb-notif" onClick={() => navigate('/notifications')}>
              {I.bell}
              {unreadCount > 0 && <span className="ml-tb-nd" title={`${unreadCount} unread`} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="ml-content">
          <Suspense fallback={<div className="ml-inner-loader"></div>}>
            <Outlet />
          </Suspense>
        </div>

      </div>

      {/* ═══════════ GLOBAL SEARCH ═══════════ */}
      {searchOpen && <GlobalSearch onClose={closeSearch} />}

    </div>
  );
}
