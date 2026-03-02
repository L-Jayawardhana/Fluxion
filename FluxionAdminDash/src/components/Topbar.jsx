import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Overview', icon: 'grid' },
  { to: '/organizations', label: 'Orgs', icon: 'building' },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/plans', label: 'Plans', icon: 'credit' },
  { to: '/logs', label: 'Logs', icon: 'shield' },
  { to: '/servers', label: 'Servers', icon: 'server' },
];

const tabIcons = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  credit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  server: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>,
};

const pageTitles = {
  '/': { title: 'Dashboard', crumb: 'System Administration / Overview' },
  '/organizations': { title: 'Organisations', crumb: 'System Administration / Organisations' },
  '/users': { title: 'Users', crumb: 'System Administration / Users' },
  '/plans': { title: 'Plans', crumb: 'System Administration / Plans' },
  '/logs': { title: 'Audit Logs', crumb: 'System Administration / Audit Logs' },
  '/servers': { title: 'Servers', crumb: 'System Administration / Servers' },
  '/settings': { title: 'Settings', crumb: 'System Administration / Settings' },
};

export default function Topbar({ onNewOrg }) {
  const location = useLocation();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pg = pageTitles[location.pathname] || { title: 'Dashboard', crumb: '' };

  return (
    <div className="topbar">
      <div className="topbar-l">
        <div>
          <div className="page-title">{pg.title}</div>
          <div className="page-crumb">{pg.crumb}</div>
        </div>
        <div className="tab-row">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
            >
              {tabIcons[t.icon]}
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="topbar-r">
        <span className="tb-clock">{clock}</span>
        <button className="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="badge-dot" />
        </button>
        <button className="icon-btn" title="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button className="tbtn tbtn-ghost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button className="tbtn tbtn-primary" onClick={onNewOrg}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Organisation
        </button>
      </div>
    </div>
  );
}
