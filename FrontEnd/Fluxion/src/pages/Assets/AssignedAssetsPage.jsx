import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../Dashboard/DashboardPage.css';

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AssignedAssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const rawName = user?.email?.split('@')[0] || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    if (!user?.userId || !user?.orgId) return;
    let cancelled = false;
    setLoading(true);
    api.get(`/Asset/user/${user.userId}?orgId=${user.orgId}`)
      .then(res => {
        if (!cancelled) setAssets(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="page db-page">
      {/* ── Greeting ─────────────────────────────────────── */}
      <div className="db-greeting">
        <div className="db-greeting-text">
          <h2>{greetingText()}, <em>{userName}.</em></h2>
          <p>Here are your currently assigned assets.</p>
        </div>
      </div>

      <div className="db-panel" style={{ marginTop: '24px' }}>
        <div className="db-panel-head">
          <span className="db-panel-title">Assigned Assets</span>
        </div>
        <div className="db-panel-body" style={{ paddingTop: 8 }}>
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--db-mist)' }}>Loading your assets...</div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--db-mist)', fontStyle: 'italic' }}>
              You have no assets assigned to you at this time.
            </div>
          ) : (
            <div className="employee-assets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '16px' }}>
              {assets.map(a => (
                <div key={a.assignmentId} className="asset-detail-card" style={{ border: '1px solid var(--db-border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--db-panel)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--db-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {a.assetType === 'Laptop' || a.assetType === 'Desktop' ? '💻' : a.assetType === 'Vehicle' ? '🚗' : '📦'} {a.assetName}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--db-dim)', marginTop: '6px' }}>Asset Tag: {a.assetTag}</div>
                    </div>
                    <span className="db-badge db-badge-prog" style={{ fontSize: '12px', padding: '4px 10px' }}>Active</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Asset Type</span>
                      <span style={{ color: 'var(--db-text)', fontWeight: 500 }}>{a.assetType}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Serial Number</span>
                      <span style={{ color: 'var(--db-text)', fontWeight: 500 }}>{a.serialNumber || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Department</span>
                      <span style={{ color: 'var(--db-text)', fontWeight: 500 }}>{a.departmentName || 'None'}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--db-border)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Purchase Date</span>
                      <span style={{ color: 'var(--db-text)', fontWeight: 500 }}>{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Warranty Ends</span>
                      <span style={{ color: 'var(--db-text)', fontWeight: 500 }}>{a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString() : 'None'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: 'var(--db-mist)' }}>Assigned On</span>
                      <span style={{ color: 'var(--db-blue)', fontWeight: 600 }}>{new Date(a.assignedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
