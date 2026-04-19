import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './GlobalSearch.css';

/* ── Role categorization ─────────────────────────────────── */
const ADMIN_ROLES      = new Set(['owner', 'admin', 'systemadmin', 'manager']);
const TECH_ROLES       = new Set(['technician']);
const USER_ROLES       = new Set(['user']);

function getRoleGroup(role) {
  const r = (role || '').toLowerCase();
  if (ADMIN_ROLES.has(r))  return 'admin';
  if (TECH_ROLES.has(r))   return 'technician';
  if (USER_ROLES.has(r))   return 'user';
  return 'user';
}

/* ── All searchable items, tagged by which roles can see them */
// roles: 'all' | 'admin' | 'technician' | 'user'
const ALL_ITEMS = [
  /* ── Universal ── */
  { section: 'Navigation',   title: 'Welcome',           sub: 'Getting started guide',           to: '/welcome',                 tag: 'Page',   roles: 'all' },
  { section: 'Navigation',   title: 'Notifications',     sub: 'In-app alerts & updates',         to: '/notifications',           tag: 'Page',   roles: 'all' },
  { section: 'Navigation',   title: 'All Tickets',       sub: 'View maintenance tickets',         to: '/tickets',                 tag: 'Maint',  roles: 'all' },
  { section: 'Navigation',   title: 'Raise Ticket',      sub: 'Log a new maintenance request',   to: '/raise-ticket',            tag: 'Maint',  roles: 'all' },
  { section: 'Navigation',   title: 'Maintenance Logs',  sub: 'Immutable repair history',        to: '/maintenance-logs',        tag: 'Maint',  roles: 'all' },
  { section: 'Help',         title: 'Support',           sub: 'Help, docs & contact',            to: '/support',                 tag: 'Help',   roles: 'all' },

  /* ── Admin / Manager / Owner only ── */
  { section: 'Navigation',   title: 'Dashboard',         sub: 'Organisation overview & stats',   to: '/dashboard',               tag: 'Page',   roles: 'admin' },
  { section: 'People',       title: 'Users',             sub: 'View and manage all users',       to: '/users',                   tag: 'People', roles: 'admin' },
  { section: 'People',       title: 'Invite Users',      sub: 'Send an invite to a new user',    to: '/invite-users',            tag: 'People', roles: 'admin' },
  { section: 'People',       title: 'Roles & Access',    sub: 'Set user roles and permissions',  to: '/roles',                   tag: 'People', roles: 'admin' },
  { section: 'Departments',  title: 'All Departments',   sub: 'Browse all org departments',      to: '/departments',             tag: 'Dept',   roles: 'admin' },
  { section: 'Departments',  title: 'Add Department',    sub: 'Create a new department',         to: '/add-department',          tag: 'Dept',   roles: 'admin' },
  { section: 'Assets',       title: 'All Assets',        sub: 'Browse registered assets',        to: '/assets',                  tag: 'Assets', roles: 'admin' },
  { section: 'Assets',       title: 'Register Asset',    sub: 'Add a new physical asset',        to: '/register-asset',          tag: 'Assets', roles: 'admin' },
  { section: 'Assets',       title: 'Asset Assignments', sub: 'Manage who owns which asset',     to: '/assignments',             tag: 'Assets', roles: 'admin' },
  { section: 'Reports',      title: 'Maintenance Cost',  sub: 'Cost breakdown by asset & dept',  to: '/report-maintenance-cost', tag: 'Report', roles: 'admin' },
  { section: 'Reports',      title: 'Warranty Expiry',   sub: 'Assets nearing expiry',           to: '/report-warranty',         tag: 'Report', roles: 'admin' },
  { section: 'Organisation', title: 'Settings',          sub: 'Org settings & subscription',     to: '/settings',                tag: 'Org',    roles: 'admin' },

  /* ── Technician only ── */
  { section: 'Technician',   title: 'Ticket Summary',    sub: 'Your technician dashboard',       to: '/technician/dashboard',    tag: 'Tech',   roles: 'technician' },
  { section: 'Technician',   title: 'My Tickets',        sub: 'Tickets assigned to you',         to: '/technician/tickets',      tag: 'Tech',   roles: 'technician' },
  { section: 'Technician',   title: 'Performance',       sub: 'Your technician metrics',         to: '/technician/performance',  tag: 'Tech',   roles: 'technician' },

  /* ── Regular user only ── */
  { section: 'My Assets',    title: 'Assigned Assets',   sub: 'Assets assigned to you',          to: '/assigned-assets',         tag: 'Assets', roles: 'user' },
];

/* ── Tag colour map ──────────────────────────────────────── */
const TAG_COLORS = {
  Page:   { bg: 'rgba(59,130,246,.12)',  color: 'rgba(100,165,255,.9)'  },
  People: { bg: 'rgba(245,158,11,.12)', color: 'rgba(245,180,80,.9)'  },
  Dept:   { bg: 'rgba(34,197,94,.12)',  color: 'rgba(80,210,130,.9)'  },
  Assets: { bg: 'rgba(200,75,47,.12)',  color: 'rgba(230,110,80,.9)'  },
  Maint:  { bg: 'rgba(99,102,241,.12)', color: 'rgba(140,145,255,.9)' },
  Tech:   { bg: 'rgba(20,184,166,.12)', color: 'rgba(60,210,200,.9)'  },
  Report: { bg: 'rgba(168,85,247,.12)', color: 'rgba(200,140,255,.9)' },
  Org:    { bg: 'rgba(255,255,255,.06)',color: 'rgba(200,200,200,.7)'  },
  Help:   { bg: 'rgba(240,165,0,.1)',   color: 'rgba(240,200,80,.9)'  },
};

/* ── Inline SVGs ─────────────────────────────────────────── */
const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6.5" cy="6.5" r="4.5" /><path d="M11 11l3 3" />
  </svg>
);
const EnterIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 4v4H3m0 0l3-3M3 8l3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PageIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="12" height="12" rx="1.5" /><path d="M5 6h6M5 9h4" />
  </svg>
);

/* ████████████████████████████████████████████████████████ */
export default function GlobalSearch({ onClose }) {
  const { user }           = useAuth();
  const roleGroup          = getRoleGroup(user?.role);

  const [query,     setQuery]     = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  /* Items the current role is allowed to see */
  const allowedItems = ALL_ITEMS.filter(item =>
    item.roles === 'all' || item.roles === roleGroup
  );

  /* Auto-focus */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Filter */
  const results = query.trim().length === 0
    ? allowedItems
    : allowedItems.filter(item =>
        [item.title, item.sub, item.section, item.tag]
          .some(s => s.toLowerCase().includes(query.toLowerCase()))
      );

  /* Reset cursor */
  useEffect(() => { setActiveIdx(0); }, [query]);

  /* Navigate */
  const go = useCallback((item) => {
    navigate(item.to);
    onClose();
  }, [navigate, onClose]);

  /* Keyboard */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape')    { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && results[activeIdx]) go(results[activeIdx]);
  }, [results, activeIdx, go, onClose]);

  /* Scroll active into view */
  useEffect(() => {
    listRef.current?.querySelector('.gs-active')?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  /* Group by section */
  const grouped = results.reduce((acc, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {});

  const tagStyle = (tag) => {
    const c = TAG_COLORS[tag] || TAG_COLORS.Org;
    return { background: c.bg, color: c.color, border: `1px solid ${c.color}33` };
  };

  let flatIdx = 0;

  return (
    <div
      className="gs-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gs-panel" role="dialog" aria-label="Global search" aria-modal="true">

        <div className="gs-input-row">
          <span className="gs-input-icon"><SearchIcon /></span>
          <input
            ref={inputRef}
            id="gs-search-input"
            className="gs-input"
            type="text"
            placeholder="Search pages, assets, people…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="gs-esc-key">Esc</span>
        </div>

        <div className="gs-results" ref={listRef} role="listbox">
          {results.length === 0 ? (
            <div className="gs-empty">
              <SearchIcon />
              <div className="gs-empty-title">No results for &ldquo;{query}&rdquo;</div>
              <div className="gs-empty-sub">Try a page name, section, or keyword</div>
            </div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className="gs-section-label">{section}</div>
                {items.map((item) => {
                  const idx = flatIdx++;
                  const isActive = idx === activeIdx;
                  return (
                    <div
                      key={item.to}
                      className={`gs-result-item${isActive ? ' gs-active' : ''}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => go(item)}
                    >
                      <div className="gs-result-icon"><PageIcon /></div>
                      <div className="gs-result-body">
                        <div className="gs-result-title">{item.title}</div>
                        <div className="gs-result-sub">{item.sub}</div>
                      </div>
                      <span className="gs-result-tag" style={tagStyle(item.tag)}>{item.tag}</span>
                      <span className="gs-result-enter"><EnterIcon /></span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="gs-footer">
          <span className="gs-footer-hint"><span className="gs-footer-key">↑↓</span> Navigate</span>
          <span className="gs-footer-hint"><span className="gs-footer-key">↵</span> Open</span>
          <span className="gs-footer-hint"><span className="gs-footer-key">Esc</span> Close</span>
        </div>

      </div>
    </div>
  );
}
