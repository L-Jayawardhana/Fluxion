import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navSections = [
  {
    label: 'SYSTEM',
    items: [
      { to: '/', icon: 'grid', label: 'Overview', chip: null },
      { to: '/organizations', icon: 'building', label: 'Organisations', chip: { text: '48', cls: 'c-b' } },
      { to: '/departments', icon: 'departments', label: 'Departments', chip: null },
      { to: '/users', icon: 'users', label: 'Users', chip: { text: '1,284', cls: 'c-b' } },
      { to: '/servers', icon: 'server', label: 'Servers', chip: null },
    ],
  },
  {
    label: 'DATA',
    items: [
      { to: '#', icon: 'database', label: 'Assets', chip: { text: '5,721', cls: 'c-g' } },
      { to: '#', icon: 'ticket', label: 'Tickets', chip: { text: '23', cls: 'c-a' } },
      { to: '#', icon: 'chart', label: 'Reports', chip: null },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { to: '/plans', icon: 'credit', label: 'Plans', chip: null },
      { to: '#', icon: 'receipt', label: 'Invoices', chip: null },
    ],
  },
  {
    label: 'SECURITY',
    items: [
      { to: '/logs', icon: 'shield', label: 'Audit Logs', chip: { text: '3', cls: 'c-r' } },
      { to: '#', icon: 'key', label: 'API Keys', chip: null },
    ],
  },
  {
    label: 'CONFIG',
    items: [
      { to: '/settings', icon: 'cog', label: 'Settings', chip: null },
      { to: '#', icon: 'email', label: 'Email Templates', chip: null },
      { to: '#', icon: 'palette', label: 'Branding', chip: null },
    ],
  },
];

const icons = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  server: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  database: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  ticket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  credit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  receipt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 10h8M8 14h4"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61A5.5 5.5 0 1 1 8.11 8.11m3.28 3.28L21 2m-4 4l3 3"/></svg>,
  cog: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  email: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  departments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="13" rx="1"/><rect x="9" y="3" width="6" height="17" rx="1"/><rect x="16" y="7" width="6" height="13" rx="1"/></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.41 1.5-1.13 0-.37-.15-.71-.39-1-.23-.28-.38-.62-.38-1 0-.93.76-1.69 1.69-1.69h2A5.58 5.58 0 0022 11.72C22 6.5 17.5 2 12 2z"/></svg>,
};

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || 'Admin')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-logo">
        <img src="/LOGOwhite.png" alt="Fluxion" className="sb-logo-img" />
        <div>
          <div className="sb-brand">FLUXION</div>
          <div className="sb-brand-sub">System Admin</div>
        </div>
      </div>

      {/* Status */}
      <div className="sb-status">
        <div className="sb-dot" />
        <div>
          <div className="sb-status-label">All Systems Operational</div>
          <div className="sb-status-sub">Last check 30 s ago</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sb-nav">
        {navSections.map((sec) => (
          <div key={sec.label}>
            <div className="sb-sec">{sec.label}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sb-item${isActive ? ' active' : ''}`
                }
              >
                {icons[item.icon]}
                {item.label}
                {item.chip && (
                  <span className={`chip ${item.chip.cls}`}>{item.chip.text}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Profile */}
      <div className="sb-profile">
        <div className="sb-av">{initials}</div>
        <div>
          <div className="sb-uname">{user?.name || 'Admin'}</div>
          <div className="sb-urole">System Admin</div>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
