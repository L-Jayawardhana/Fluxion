import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import ReportIssueModal from '../../components/MaintenanceTickets/ReportIssueModal';
import '../Dashboard/DashboardPage.css';

const WrenchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const [reportTarget, setReportTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const rawName = user?.email?.split('@')[0] || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const loadAssets = useCallback((cancelled = false) => {
    if (!user?.userId || !user?.orgId) return;
    setLoading(true);
    api.get(`/Asset/user/${user.userId}?orgId=${user.orgId}`)
      .then(res => {
        if (!cancelled) setAssets(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssets(cancelled);
    return () => { cancelled = true; };
  }, [loadAssets]);

  return (
    <div className="page db-page">
      {/* ── Greeting ─────────────────────────────────────── */}
      <div className="db-greeting">
        <div className="db-greeting-text">
          <h2>{greetingText()}, <em>{userName}.</em></h2>
          <p>Here are your currently assigned assets.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(45,148,86,.1)', border: '1px solid rgba(45,148,86,.3)', borderRadius: '8px', color: '#1E7A3C', fontSize: '13px', marginTop: '20px', animation: 'dbFadeUp .2s both' }}>
          {successMsg}
        </div>
      )}

      {/* ── Report Issue modal ──────────────────────────── */}
      {reportTarget && (
        <ReportIssueModal
          asset={reportTarget}
          onClose={() => setReportTarget(null)}
          onSuccess={() => {
            setSuccessMsg(`Maintenance ticket raised for "${reportTarget.assetName}" successfully.`);
            setTimeout(() => setSuccessMsg(null), 4000);
            setReportTarget(null);
            loadAssets();
          }}
        />
      )}

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
                    <span
                      className={`db-badge ${
                        a.status === 'under_maintenance' ? 'db-badge-prog' :
                        a.status === 'retired' ? 'db-badge-open' :
                        'db-badge-done'
                      }`}
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      {a.status === 'under_maintenance' ? 'Maintenance' :
                       a.status === 'retired' ? 'Retired' :
                       'Active'}
                    </span>
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
                    
                    {/* Actions block */}
                    {a.status !== 'retired' && a.status !== 'under_maintenance' && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--db-border2)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setReportTarget(a)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(200,75,47,.08)', border: '1px solid rgba(200,75,47,.2)', borderRadius: '6px',
                            padding: '6px 12px', fontSize: '12px', fontFamily: '"Syne", sans-serif', fontWeight: 600,
                            color: '#C84B2F', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(200,75,47,.15)'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(200,75,47,.08)'; }}
                        >
                          <WrenchIcon /> Report Issue
                        </button>
                      </div>
                    )}
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
