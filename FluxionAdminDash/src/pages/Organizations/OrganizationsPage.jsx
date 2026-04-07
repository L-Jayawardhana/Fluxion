import { useState, useEffect, useCallback } from 'react';
import { getOrganizations, deleteOrganization, updateOrganization } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

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
  const [deleteId, setDeleteId] = useState(null);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
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
      addToast('Failed to fetch organizations', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    try {
      await deleteOrganization(deleteId);
      addToast('Organization deleted successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to delete org', error);
      addToast('Failed to delete organization', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (org) => {
    setEditingOrg({ ...org });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      if (!editingOrg) return;
      await updateOrganization(editingOrg.orgId, {
        orgId: editingOrg.orgId,
        orgName: editingOrg.orgName,
        slug: editingOrg.slug,
        timezone: editingOrg.timezone,
        isActive: editingOrg.isActive
      });
      addToast('Organization updated successfully', 'success');
      setEditingOrg(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update org', error);
      addToast('Failed to update organization', 'error');
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
    <div className="pad">
      <ConfirmModal 
        open={!!deleteId} 
        title="Delete Organization"
        message="Are you sure you want to delete this organization? This action cannot be undone."
        onConfirm={handleDelete} 
        onCancel={() => setDeleteId(null)}
      />

      {editingOrg && (
        <div className="overlay open" onClick={handleCancelEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Edit Organization</div>
              <button className="modal-x" onClick={handleCancelEdit}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="mf">
                  <label className="ml">Name</label>
                  <input 
                    className="mi"
                    type="text" 
                    value={editingOrg.orgName} 
                    onChange={e => setEditingOrg({...editingOrg, orgName: e.target.value})}
                    required
                  />
                </div>

                <div className="mf">
                  <label className="ml">Slug</label>
                  <input 
                    className="mi"
                    type="text" 
                    value={editingOrg.slug} 
                    onChange={e => setEditingOrg({...editingOrg, slug: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mf">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt)', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={editingOrg.isActive} 
                      onChange={e => setEditingOrg({...editingOrg, isActive: e.target.checked})}
                    />
                    Active Status
                  </label>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="mc" onClick={handleCancelEdit}>Cancel</button>
                <button type="submit" className="mok">Save Changes</button>
              </div>
            </form>
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
                         <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${o.logoUrl}`} alt="" className="org-av" style={{objectFit: 'cover'}} />
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
                      <button className="ract" title="Edit" onClick={() => handleEdit(o)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="ract del" title="Delete" onClick={() => setDeleteId(o.orgId)}>
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
