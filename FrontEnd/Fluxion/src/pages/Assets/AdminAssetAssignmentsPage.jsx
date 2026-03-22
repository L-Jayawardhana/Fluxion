import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../Users/UsersPage.css';

/* ── SVG icons ───────────────────────────────── */
const Icons = {
  refresh: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 8a7 7 0 0013.3-3M15 8A7 7 0 001.7 11" strokeLinecap="round"/><path d="M12 1l2.3 4-4 .3M4 15l-2.3-4 4-.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  assign: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1v14M1 8h14" strokeLinecap="round"/></svg>,
  asset: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 7h6M5 10h3"/></svg>,
  user: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  revoke: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>,
};

export default function AdminAssetAssignmentsPage() {
  const { user } = useAuth();

  /* ── State ── */
  const [users, setUsers] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [unassignTarget, setUnassignTarget] = useState(null);

  /* ── Fetch initial data ── */
  const fetchInitialData = async () => {
    if (!user?.orgId) return;
    try {
      setLoading(true);
      const [usersRes, assetsRes] = await Promise.all([
        api.get(`/User`),
        api.get(`/Asset?orgId=${user.orgId}`)
      ]);
      const registeredEmployees = usersRes.data.filter(u =>
        u.role?.toLowerCase() === 'user' && u.invitationAccepted === true
      );
      setUsers(registeredEmployees);
      setAllAssets(assetsRes.data);
    } catch {
      setMessage({ text: 'Failed to load organization data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, [user?.orgId]);

  /* ── Fetch user assignments ── */
  const fetchUserAssignments = async (userId) => {
    if (!userId || !user?.orgId) return;
    try {
      setLoadingAssignments(true);
      const res = await api.get(`/Asset/user/${userId}?orgId=${user.orgId}`);
      setAssignedAssets(res.data);
    } catch {
      setMessage({ text: 'Failed to load user assignments.', type: 'error' });
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchUserAssignments(selectedUserId);
      setSelectedAssetId('');
    } else {
      setAssignedAssets([]);
    }
  }, [selectedUserId, user?.orgId]);

  /* ── Assign ── */
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedAssetId) return;
    setProcessing(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put(`/Asset/${selectedAssetId}/assign`, {
        userId: parseInt(selectedUserId),
        orgId: parseInt(user.orgId),
        assignedBy: parseInt(user.userId)
      });
      setMessage({ text: 'Asset assigned successfully!', type: 'success' });
      setSelectedAssetId('');
      await Promise.all([fetchInitialData(), fetchUserAssignments(selectedUserId)]);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to assign asset.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  /* ── Unassign ── */
  const handleUnassign = (asset) => {
    setUnassignTarget(asset);
  };

  const confirmUnassign = async () => {
    if (!unassignTarget) return;
    const assetName = unassignTarget.assetName;
    const assetId = unassignTarget.assetId;
    setUnassignTarget(null);
    setProcessing(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put(`/Asset/${assetId}/unassign`, {
        userId: parseInt(selectedUserId),
        orgId: parseInt(user.orgId)
      });
      setMessage({ text: `"${assetName}" has been unassigned successfully.`, type: 'success' });
      await Promise.all([fetchInitialData(), fetchUserAssignments(selectedUserId)]);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to unassign asset.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  /* ── Computed data ── */
  const selectedUserObj = users.find(u => u.userId === parseInt(selectedUserId));
  const selectedDeptId = selectedUserObj?.departmentId;
  const assignableAssets = allAssets.filter(a =>
    a.status?.toLowerCase() === 'available' &&
    (!selectedDeptId || a.departmentId === selectedDeptId)
  );

  const totalAssets = allAssets.length;
  const availableCount = allAssets.filter(a => a.status?.toLowerCase() === 'available').length;
  const assignedCount = totalAssets - availableCount;

  /* ── Render ── */
  return (
    <div className="page up-page">

      {/* ── Unassign confirmation modal ────────────── */}
      {unassignTarget && (
        <div className="up-overlay" onClick={() => setUnassignTarget(null)}>
          <div className="up-confirm" onClick={e => e.stopPropagation()}>
            <div className="up-confirm-icon">⚠️</div>
            <div className="up-confirm-title">Unassign Asset</div>
            <div className="up-confirm-msg">
              Are you sure you want to unassign <strong>"{unassignTarget.assetName}"</strong> from
              {selectedUserObj ? ` ${selectedUserObj.fullName}` : ' this user'}?
              The asset will be returned to the available pool.
            </div>
            <div className="up-confirm-acts">
              <button className="up-btn up-btn-secondary" onClick={() => setUnassignTarget(null)}>Cancel</button>
              <button className="up-btn up-btn-danger" onClick={confirmUnassign}>Unassign</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="up-header">
        <div>
          <div className="up-eyebrow">Equipment Distribution</div>
          <h1 className="up-title">Asset Assignments</h1>
          <p className="up-subtitle">Assign hardware to employees or manage existing allocations.</p>
        </div>
        <div className="up-header-actions">
          <button className="up-btn-refresh" onClick={fetchInitialData} title="Refresh">
            {Icons.refresh} Refresh
          </button>
        </div>
      </div>

      {/* ── Error / Success ── */}
      {message.text && (
        <div className={message.type === 'error' ? 'up-error' : ''} style={message.type === 'success' ? {
          background: 'rgba(45,148,86,.08)', border: '1px solid rgba(45,148,86,.2)', color: 'var(--db-green)',
          borderRadius: '8px', padding: '12px 18px', fontSize: '13px', marginBottom: '20px'
        } : { marginBottom: '20px' }}>
          {message.type === 'success' ? '✓ ' : '⚠ '}{message.text}
        </div>
      )}

      {/* ── Stats ── */}
      {!loading && (
        <div className="up-stats-row">
          <div className="up-stat blue">
            <div className="up-stat-icon">{Icons.user}</div>
            <div>
              <div className="up-stat-val">{users.length}</div>
              <div className="up-stat-lbl">Employees</div>
            </div>
          </div>
          <div className="up-stat green">
            <div className="up-stat-icon green">{Icons.asset}</div>
            <div>
              <div className="up-stat-val">{availableCount}</div>
              <div className="up-stat-lbl">Available</div>
            </div>
          </div>
          <div className="up-stat amber">
            <div className="up-stat-icon amber">{Icons.assign}</div>
            <div>
              <div className="up-stat-val">{assignedCount}</div>
              <div className="up-stat-lbl">Assigned</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assignment Form Panel ── */}
      <div className="up-panel" style={{ marginBottom: '20px' }}>
        <div className="up-panel-head">
          <div className="up-panel-title">Assign Equipment</div>
          {selectedUserObj && (
            <span className="up-panel-count">
              Department: <strong>{selectedUserObj.departmentName || 'Unassigned'}</strong> · {assignableAssets.length} asset{assignableAssets.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        {loading ? (
          <div className="up-loading"><div className="up-spinner" /> Loading data…</div>
        ) : (
          <div style={{ padding: '20px' }}>
            <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--db-dim)', fontWeight: 400 }}>Employee</label>
                <select
                  className="up-select"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} ({u.departmentName ?? 'No Dept'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--db-dim)', fontWeight: 400 }}>
                  Available Asset {selectedUserId ? `(${assignableAssets.length})` : ''}
                </label>
                <select
                  className="up-select"
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                  disabled={!selectedUserId}
                  style={{ opacity: selectedUserId ? 1 : 0.5 }}
                >
                  <option value="">
                    {!selectedUserId ? '-- Select Employee First --' : assignableAssets.length === 0 ? '-- No Available Assets in Dept --' : '-- Choose Asset --'}
                  </option>
                  {selectedUserId && assignableAssets.map(a => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.assetTag ? `[${a.assetTag}] ` : ''}{a.assetName} — {a.assetType}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="up-btn up-btn-primary"
                disabled={!selectedUserId || !selectedAssetId || processing}
                style={{ height: '40px' }}
              >
                {processing ? 'Assigning…' : 'Assign Asset'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Current Hardware Panel ── */}
      <div className="up-panel" style={{ opacity: selectedUserId ? 1 : 0.4, transition: 'opacity .3s' }}>
        <div className="up-panel-head">
          <div className="up-panel-title">
            {selectedUserObj ? `${selectedUserObj.fullName}'s Hardware` : 'Current Hardware'}
          </div>
          {selectedUserId && (
            <span className="up-panel-count">{assignedAssets.length} item{assignedAssets.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {!selectedUserId ? (
          <div className="up-empty">
            <div className="up-empty-icon">📦</div>
            <div className="up-empty-title">Select an employee</div>
            <div className="up-empty-sub">Choose an employee above to view their currently assigned hardware.</div>
          </div>
        ) : loadingAssignments ? (
          <div className="up-loading"><div className="up-spinner" /> Loading hardware…</div>
        ) : assignedAssets.length === 0 ? (
          <div className="up-empty">
            <div className="up-empty-icon">🔓</div>
            <div className="up-empty-title">No hardware assigned</div>
            <div className="up-empty-sub">This employee has no equipment allocated yet. Use the form above to assign one.</div>
          </div>
        ) : (
          <div className="up-table-wrap">
            <table className="up-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Warranty</th>
                  <th>Assigned</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {assignedAssets.map(a => (
                  <tr key={a.assignmentId}>
                    <td>
                      <div className="up-user-cell">
                        <div className="up-avatar" style={{ background: 'var(--db-blue)', borderRadius: '8px' }}>
                          {Icons.asset}
                        </div>
                        <div>
                          <div className="up-user-name">{a.assetName}</div>
                          <div className="up-user-email">
                            {a.assetTag} {a.serialNumber ? `· S/N ${a.serialNumber}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="up-role-chip">{a.assetType || 'N/A'}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--db-mist)' }}>{a.departmentName || 'N/A'}</td>
                    <td className="up-date">
                      {a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="up-date">
                      {new Date(a.assignedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="up-btn up-btn-danger"
                        title="Unassign asset"
                        onClick={() => handleUnassign(a)}
                        disabled={processing}
                        style={{ padding: '6px 14px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        {Icons.revoke} Unassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
