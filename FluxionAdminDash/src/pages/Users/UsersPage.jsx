import { useState, useEffect } from 'react';
import { getUsers } from '../../services/api';

const roleFilters = ['All', 'Owner', 'Admin', 'Technician', 'User', 'SystemAdmin'];

const roleBadgeColors = {
  Owner: { bg: '#F5F3FF', color: '#7C3AED' },
  Admin: { bg: '#EFF6FF', color: '#2563EB' },
  Technician: { bg: '#FEF3C7', color: '#D97706' },
  User: { bg: '#F1F5F9', color: '#64748B' },
  SystemAdmin: { bg: '#FFF1F2', color: '#E11D48' }
};

export default function UsersPage() {
  const [filter, setFilter] = useState('All');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      const mapped = data.map(u => ({
        ...u,
        name: u.fullName,
        email: u.email,
        role: capitalize(u.role),
        org: u.organizationName || 'No Org',
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never',
        joined: new Date(u.createdAt).toLocaleDateString(),
        color: stringToColor(u.fullName)
      }));
      setUsers(mapped);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  const filtered = filter === 'All' ? users : users.filter((u) => u.role === filter);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="filter-row">
        {roleFilters.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && ` (${users.filter((u) => u.role === f).length})`}
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
              const statCls = u.status === 'active' ? 'sp-active' : 'sp-inactive';
              return (
                <tr key={u.userId || u.email}>
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