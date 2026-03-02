import { useState } from 'react';

const ORGS = [
  { name: 'Acme Corp', slug: 'acme-corp', plan: 'Pro', owner: 'Sarah Chen', users: 45, maxUsers: 50, assets: 1230, tickets: 12, status: 'active', color: '#3B72F6' },
  { name: 'TechStart Inc', slug: 'techstart', plan: 'Free', owner: 'John Doe', users: 12, maxUsers: 15, assets: 340, tickets: 5, status: 'trial', color: '#16A34A' },
  { name: 'BuildRight LLC', slug: 'buildright', plan: 'Enterprise', owner: 'Mike Wilson', users: 89, maxUsers: 500, assets: 2100, tickets: 32, status: 'active', color: '#7C3AED' },
  { name: 'DataFlow Systems', slug: 'dataflow', plan: 'Pro', owner: 'Emily Brown', users: 34, maxUsers: 50, assets: 890, tickets: 8, status: 'active', color: '#D97706' },
  { name: 'CloudNine Tech', slug: 'cloudnine', plan: 'Pro', owner: 'Alex Kim', users: 28, maxUsers: 50, assets: 650, tickets: 15, status: 'active', color: '#DC2626' },
  { name: 'GreenLeaf Bio', slug: 'greenleaf', plan: 'Free', owner: 'Lisa Park', users: 8, maxUsers: 15, assets: 156, tickets: 2, status: 'inactive', color: '#0D9488' },
  { name: 'Quantum Labs', slug: 'quantum-labs', plan: 'Enterprise', owner: 'David Kim', users: 120, maxUsers: 500, assets: 3400, tickets: 45, status: 'active', color: '#4F46E5' },
  { name: 'SolarEdge Inc', slug: 'solaredge', plan: 'Pro', owner: 'Mia Zhang', users: 42, maxUsers: 50, assets: 980, tickets: 11, status: 'active', color: '#EA580C' },
];

const filters = ['All', 'Pro', 'Free', 'Enterprise'];

function pctColor(pct) {
  if (pct > 90) return '#EF4444';
  if (pct > 70) return '#F59E0B';
  return '#22C55E';
}

export default function OrganizationsPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? ORGS : ORGS.filter((o) => o.plan === filter);

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <div className="filter-row">
        {filters.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && ` (${ORGS.filter((o) => o.plan === f).length})`}
          </button>
        ))}
        <div className="fspacer" />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{filtered.length} organisations</span>
      </div>

      <div className="panel">
        <table className="otbl">
          <thead>
            <tr>
              <th>Organisation</th><th>Plan</th><th>Owner</th><th>Users</th>
              <th>Assets</th><th>Tickets</th><th>Seat Usage</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const planCls = o.plan === 'Pro' ? 'pt-pro' : o.plan === 'Enterprise' ? 'pt-ent' : 'pt-free';
              const statCls = o.status === 'active' ? 'sp-active' : o.status === 'trial' ? 'sp-trial' : 'sp-inactive';
              const pct = Math.round((o.users / o.maxUsers) * 100);
              return (
                <tr key={o.slug}>
                  <td>
                    <div className="org-cell">
                      <div className="org-av" style={{ background: o.color }}>{o.name[0]}</div>
                      <div><div className="org-name">{o.name}</div><div className="org-slug">{o.slug}</div></div>
                    </div>
                  </td>
                  <td><span className={`plan-tag ${planCls}`}>{o.plan}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.owner}</td>
                  <td style={{ fontWeight: 600 }}>{o.users}</td>
                  <td style={{ fontWeight: 600 }}>{o.assets.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{o.tickets}</td>
                  <td>
                    <div className="ubar-wrap">
                      <div className="ubar"><div className="ufill" style={{ width: pct + '%', background: pctColor(pct) }} /></div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pctColor(pct) }}>{pct}%</span>
                    </div>
                  </td>
                  <td><span className={`spill ${statCls}`}>{o.status}</span></td>
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