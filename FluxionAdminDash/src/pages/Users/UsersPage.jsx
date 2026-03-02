import { useState } from 'react';

const USERS = [
  { name: 'Sarah Chen', email: 'sarah@acme.com', role: 'Owner', org: 'Acme Corp', status: 'active', lastLogin: '2 min ago', joined: 'Jan 2024', color: '#3B72F6' },
  { name: 'John Doe', email: 'john@techstart.com', role: 'Admin', org: 'TechStart', status: 'active', lastLogin: '1 hr ago', joined: 'Mar 2024', color: '#16A34A' },
  { name: 'Mike Wilson', email: 'mike@buildright.com', role: 'Owner', org: 'BuildRight', status: 'active', lastLogin: '5 min ago', joined: 'Dec 2023', color: '#7C3AED' },
  { name: 'Emily Brown', email: 'emily@dataflow.io', role: 'Technician', org: 'DataFlow', status: 'active', lastLogin: '30 min ago', joined: 'Feb 2024', color: '#D97706' },
  { name: 'Alex Kim', email: 'alex@cloudnine.co', role: 'User', org: 'CloudNine', status: 'pending', lastLogin: 'Never', joined: 'Jun 2024', color: '#DC2626' },
  { name: 'Lisa Park', email: 'lisa@greenleaf.bio', role: 'Admin', org: 'GreenLeaf', status: 'inactive', lastLogin: '2 weeks ago', joined: 'Apr 2024', color: '#0D9488' },
  { name: 'David Kim', email: 'david@quantum.ai', role: 'Owner', org: 'Quantum Labs', status: 'active', lastLogin: '10 min ago', joined: 'Nov 2023', color: '#4F46E5' },
  { name: 'Mia Zhang', email: 'mia@solaredge.com', role: 'Technician', org: 'SolarEdge', status: 'active', lastLogin: '1 hr ago', joined: 'May 2024', color: '#EA580C' },
];

const roleFilters = ['All', 'Owner', 'Admin', 'Technician', 'User'];

const roleBadgeColors = {
  Owner: { bg: '#F5F3FF', color: '#7C3AED' },
  Admin: { bg: '#EFF6FF', color: '#2563EB' },
  Technician: { bg: '#FEF3C7', color: '#D97706' },
  User: { bg: '#F1F5F9', color: '#64748B' },
};

export default function UsersPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? USERS : USERS.filter((u) => u.role === filter);

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="filter-row">
        {roleFilters.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && ` (${USERS.filter((u) => u.role === f).length})`}
          </button>
        ))}
        <div className="fspacer" />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{filtered.length} users</span>
      </div>

      <div className="panel">
        <table className="bigtbl">
          <thead>
            <tr>
              <th>User</th><th>Role</th><th>Organisation</th><th>Status</th>
              <th>Last Login</th><th>Joined</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const rb = roleBadgeColors[u.role] || roleBadgeColors.User;
              const statCls = u.status === 'active' ? 'sp-active' : u.status === 'pending' ? 'sp-trial' : 'sp-inactive';
              return (
                <tr key={u.email}>
                  <td>
                    <div className="org-cell">
                      <div className="org-av" style={{ background: u.color, borderRadius: '50%' }}>{u.name.split(' ').map(w => w[0]).join('')}</div>
                      <div>
                        <div className="org-name">{u.name}</div>
                        <div className="org-slug">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="ubadge" style={{ background: rb.bg, color: rb.color }}>{u.role}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.org}</td>
                  <td><span className={`spill ${statCls}`}>{u.status}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--dim)' }}>{u.lastLogin}</td>
                  <td style={{ fontSize: 11, color: 'var(--dim)' }}>{u.joined}</td>
                  <td>
                    <div className="row-acts">
                      <button className="ract" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ract del" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}