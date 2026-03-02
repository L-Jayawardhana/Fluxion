import { useState, useEffect } from 'react';
import { getOrganizations, deleteOrganization, updateOrganization } from '../../services/api';

const filters = ['All', 'Active', 'Inactive'];

function pctColor(pct) {
  if (pct > 90) return '#EF4444';
  if (pct > 70) return '#F59E0B';
  return '#22C55E';
}

export default function OrganizationsPage() {
  const [filter, setFilter] = useState('All');
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getOrganizations();
      // Map backend data to UI format
      const mapped = data.map(o => ({
        ...o,
        plan: 'Free', // Default plan since backend doesn't have it yet
        maxUsers: 10,
        tickets: 0,
        color: stringToColor(o.orgName)
      }));
      setOrgs(mapped);
    } catch (error) {
      console.error('Failed to fetch orgs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    try {
      await deleteOrganization(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete org', error);
      alert('Failed to delete organization');
    }
  };

  const handleEdit = (org) => {
    setEditingOrg({ ...org });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingOrg) return;
      await updateOrganization(editingOrg.orgId, {
        orgId: editingOrg.orgId,
        orgName: editingOrg.orgName,
        slug: editingOrg.slug,
        timezone: editingOrg.timezone,
        isActive: editingOrg.isActive
      });
      setEditingOrg(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update org', error);
      alert('Failed to update organization');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrg(null);
  };

  // Helper to generate consistent color from string
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  const filtered = filter === 'All' 
    ? orgs 
    : filter === 'Active' 
        ? orgs.filter(o => o.isActive) 
        : orgs.filter(o => !o.isActive);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      {editingOrg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)', padding: '24px', borderRadius: '12px',
            width: '400px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--txt)' }}>Edit Organization</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>Name</label>
              <input 
                type="text" 
                value={editingOrg.orgName} 
                onChange={e => setEditingOrg({...editingOrg, orgName: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>Slug</label>
              <input 
                type="text" 
                value={editingOrg.slug} 
                onChange={e => setEditingOrg({...editingOrg, slug: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)' }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt)', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editingOrg.isActive} 
                  onChange={e => setEditingOrg({...editingOrg, isActive: e.target.checked})}
                />
                Active Status
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={handleCancelEdit}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3B82F6', color: 'white', cursor: 'pointer', fontWeight: 500 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filter-row">
        {filters.map((f) => (
          <button key={f} className={`fpill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && ` (${filter === 'Active' ? orgs.filter(o => o.isActive).length : orgs.filter(o => !o.isActive).length})`}
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
              const planCls = 'pt-free';
              const statCls = o.isActive ? 'sp-active' : 'sp-inactive';
              const pct = o.usersCount ? Math.round((o.usersCount / o.maxUsers) * 100) : 0;
              const statusText = o.isActive ? 'active' : 'inactive';
              
              return (
                <tr key={o.orgId}>
                  <td>
                    <div className="org-cell">
                      {o.logoUrl ? (
                         <img src={`http://localhost:5226${o.logoUrl}`} alt="" className="org-av" style={{objectFit: 'cover'}} />
                      ) : (
                        <div className="org-av" style={{ background: o.color }}>{o.orgName[0]}</div>
                      )}
                      <div><div className="org-name">{o.orgName}</div><div className="org-slug">{o.slug}</div></div>
                    </div>
                  </td>
                  <td><span className={`plan-tag ${planCls}`}>{o.plan}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.ownerName || 'Unknown'}</td>
                  <td style={{ fontWeight: 600 }}>{o.usersCount}</td>
                  <td style={{ fontWeight: 600 }}>{o.assetsCount}</td>
                  <td style={{ fontWeight: 600 }}>{o.tickets}</td>
                  <td>
                    <div className="ubar-wrap">
                      <div className="ubar"><div className="ufill" style={{ width: pct + '%', background: pctColor(pct) }} /></div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pctColor(pct) }}>{pct}%</span>
                    </div>
                  </td>
                  <td><span className={`spill ${statCls}`}>{statusText}</span></td>
                  <td>
                    <div className="row-acts">
                      <button className="ract" title="Edit" onClick={() => setEditingOrg(o)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ract del" title="Delete" onClick={() => handleDelete(o.orgId)}>
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