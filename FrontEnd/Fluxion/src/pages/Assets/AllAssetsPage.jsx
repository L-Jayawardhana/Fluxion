import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizations, getDepartments, getAssets, retireAsset } from '../../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import './AllAssetsPage.css';

/* ── SVG Icons ───────────────────────────────────────────── */
const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M8 1v14M1 8h14" strokeLinecap="round" />
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 8a7 7 0 0013.3-3M15 8A7 7 0 001.7 11" strokeLinecap="round" />
    <path d="M12 1l2.3 4-4 .3M4 15l-2.3-4 4-.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

/* ── Helpers ──────────────────────────────────────────────── */
const ASSET_TYPES = [
  'Laptop', 'Desktop', 'Monitor', 'Printer',
  'Phone', 'Tablet', 'Vehicle', 'Furniture',
  'Networking', 'Other',
];

const STATUS_LABELS = {
  available: 'Available',
  assigned: 'Assigned',
  under_maintenance: 'Maintenance',
  retired: 'Retired',
};

const fmtCost = (cost) =>
  cost != null ? `$${Number(cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

/* ████████████████████████████████████████████████████████████ */
export default function AllAssetsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'systemAdmin' || user?.role === 'admin';

  const [userOrg, setUserOrg] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [retireTarget, setRetireTarget] = useState(null);

  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* ── Load data ──────────────────────────────────────────── */
  useEffect(() => { loadData(); }, [user]);

  const loadData = () => {
    setLoading(true);
    setError(null);

    if (!user?.orgId) {
      setError('Unable to load your organisation. Please try again.');
      setLoading(false);
      return;
    }

    Promise.all([
      getOrganizations(),
      getDepartments(user.orgId),
      getAssets(user.orgId),
    ])
      .then(([orgs, depts, assetList]) => {
        const org = orgs.find(o => Number(o.orgId) === Number(user.orgId));
        setUserOrg(org || null);
        setDepartments(depts.filter(d => d.isActive));
        setAssets(assetList);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load assets. Please try again.');
        setLoading(false);
      });
  };

  /* ── Filtered list (client-side for instant interaction) ── */
  const filtered = useMemo(() => {
    let list = assets;
    if (filterDept)
      list = list.filter(a => String(a.departmentId) === filterDept);
    if (filterType)
      list = list.filter(a => a.assetType === filterType);
    if (filterStatus)
      list = list.filter(a => a.status === filterStatus);
    return list;
  }, [assets, filterDept, filterType, filterStatus]);

  /* ── Dynamic filter types ───────────────────────────────── */
  const allAssetTypes = useMemo(() => {
    const types = new Set([...ASSET_TYPES, ...assets.map(a => a.assetType)]);
    // Keep 'Other' at the end
    types.delete('Other');
    return [...Array.from(types).sort(Intl.Collator().compare), 'Other'];
  }, [assets]);

  /* ── Stats ──────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    assigned: assets.filter(a => a.status === 'assigned').length,
    maintenance: assets.filter(a => a.status === 'under_maintenance').length,
  }), [assets]);

  const clearFilters = () => { setFilterDept(''); setFilterType(''); setFilterStatus(''); };
  const hasFilters = filterDept || filterType || filterStatus;

  /* ── Handlers ───────────────────────────────────────────── */
  const handleRetire = (asset) => {
    if (asset.status === 'assigned') {
      setError('Cannot retire an assigned asset. Please unassign it first.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    setRetireTarget(asset);
  };

  const confirmRetire = async () => {
    if (!retireTarget) return;
    const assetName = retireTarget.assetName;
    setRetireTarget(null);
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await retireAsset(retireTarget.assetId, user.orgId, user.userId);
      setSuccessMsg(`"${assetName}" has been retired successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retire asset.');
      setLoading(false);
    }
  };

  /* ── QR Code Handlers ───────────────────────────────────── */
  const generateQrText = (asset) => {
    return `Asset: ${asset.assetName}\nType: ${asset.assetType}\nDept: ${asset.departmentName || 'Unassigned'}\nTag: ${asset.assetTag || 'N/A'}\nSN: ${asset.serialNumber || 'N/A'}\nWarranty: ${asset.warrantyEndDate ? new Date(asset.warrantyEndDate).toLocaleDateString() : 'N/A'}\nPrice: ${asset.cost != null ? '$' + Number(asset.cost).toFixed(2) : 'N/A'}`;
  };

  const downloadQR = (asset) => {
    const canvas = document.getElementById(`qr-${asset.assetId}`);
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${asset.assetTag || asset.assetId}.png`;
    downloadLink.click();
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="page aa-page">

      {/* ── Retire confirmation modal ─────────────────── */}
      {retireTarget && (
        <div className="aa-overlay" onClick={() => setRetireTarget(null)}>
          <div className="aa-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="aa-confirm-icon">⚠️</div>
            <div className="aa-confirm-title">Retire Asset</div>
            <div className="aa-confirm-msg">
              Are you sure you want to retire <strong>"{retireTarget.assetName}"</strong>?
              This action will mark the asset as permanently unavailable.
            </div>
            <div className="aa-confirm-acts">
              <button className="aa-btn aa-btn-secondary" onClick={() => setRetireTarget(null)}>Cancel</button>
              <button className="aa-btn aa-btn-danger" onClick={confirmRetire}>Retire Asset</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────── */}
      <div className="aa-header">
        <div className="aa-header-text">
          <h1 className="aa-title">All Assets</h1>
          <p className="aa-subtitle">View and manage all assets in your organisation</p>
        </div>
        <div className="aa-header-actions">
          <button className="aa-btn-refresh" onClick={loadData} title="Refresh">
            <RefreshIcon /> Refresh
          </button>
          {isOwner && (
            <Link to="/register-asset" className="aa-btn-add">
              <PlusIcon /> Register Asset
            </Link>
          )}
        </div>
      </div>

      {/* ── Org pill ────────────────────────────────────── */}
      {userOrg && (
        <div className="aa-org-pill">
          <span>Organisation</span>
          {userOrg.orgName}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="aa-error">
          ⚠ {error}
        </div>
      )}

      {/* ── Success message ──────────────────────────────── */}
      {successMsg && (
        <div className="aa-success-msg">
          ✓ {successMsg}
          <button className="aa-success-close" onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────── */}
      {!loading && (
        <div className="aa-stats-row">
          <div className="aa-stat-card blue">
            <div className="aa-stat-label">Total Assets</div>
            <div className="aa-stat-value">{stats.total}</div>
            <div className="aa-stat-sub">registered</div>
          </div>
          <div className="aa-stat-card green">
            <div className="aa-stat-label">Available</div>
            <div className="aa-stat-value">{stats.available}</div>
            <div className="aa-stat-sub">ready to assign</div>
          </div>
          <div className="aa-stat-card amber">
            <div className="aa-stat-label">Assigned</div>
            <div className="aa-stat-value">{stats.assigned}</div>
            <div className="aa-stat-sub">in use</div>
          </div>
          <div className="aa-stat-card rust">
            <div className="aa-stat-label">Maintenance</div>
            <div className="aa-stat-value">{stats.maintenance}</div>
            <div className="aa-stat-sub">under repair</div>
          </div>
        </div>
      )}

      {/* ── Main panel ──────────────────────────────────── */}
      <div className="aa-panel">
        <div className="aa-panel-head">
          <div className="aa-panel-title">Asset Inventory</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="aa-filters">
              <select
                className="aa-filter-select"
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
              <select
                className="aa-filter-select"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                {allAssetTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="aa-filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="under_maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              {hasFilters && (
                <button className="aa-filter-clear" onClick={clearFilters}>
                  ✕ Clear
                </button>
              )}
            </div>
            <span className="aa-panel-count">
              {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div className="aa-loading">
            <div className="aa-spinner" />
            Loading assets…
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="aa-empty">
            <div className="aa-empty-icon" style={{ opacity: 0.6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="aa-empty-title">
              {assets.length === 0
                ? 'No assets registered yet'
                : 'No assets match your filters'}
            </div>
            <div className="aa-empty-sub">
              {assets.length === 0
                ? 'Register your first asset to get started.'
                : 'Try adjusting the filters above.'}
            </div>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="aa-table-wrap">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Serial Number</th>
                    <th>Cost</th>
                    <th style={{ width: 60, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(asset => (
                    <tr key={asset.assetId}>
                      <td>
                        <div className="aa-asset-name">{asset.assetName}</div>
                        {asset.assetTag && (
                          <div className="aa-asset-tag">{asset.assetTag}</div>
                        )}
                      </td>
                      <td>
                        <span className="aa-type-chip">
                          {asset.assetType}
                        </span>
                      </td>
                      <td>
                        {asset.departmentName
                          ? <span className="aa-dept-name">{asset.departmentName}</span>
                          : <span className="aa-dept-none">Unassigned</span>}
                      </td>
                      <td>
                        <span className={`aa-badge aa-badge-${asset.status}`}>
                          {STATUS_LABELS[asset.status] || asset.status}
                        </span>
                      </td>
                      <td>
                        {asset.assignedToUserName
                          ? <span className="aa-dept-name">{asset.assignedToUserName}</span>
                          : <span className="aa-dept-none">—</span>}
                      </td>
                      <td>
                        <div className="aa-asset-tag">
                          {asset.serialNumber || '—'}
                        </div>
                      </td>
                      <td>
                        <span className="aa-cost">{fmtCost(asset.cost)}</span>
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          className="aa-btn-refresh aa-btn-icon-only" 
                          style={{ padding: '6px', minWidth: 0 }} 
                          onClick={() => downloadQR(asset)} 
                          title="Download QR"
                        >
                          <DownloadIcon />
                        </button>
                        {isOwner && asset.status !== 'retired' && (
                          <button
                            className="aa-btn-refresh aa-btn-icon-only"
                            style={{ padding: '6px', minWidth: 0, color: asset.status === 'assigned' ? '#999' : '#dc2626', borderColor: asset.status === 'assigned' ? '#ccc' : '#fca5a5', backgroundColor: asset.status === 'assigned' ? '#f3f4f6' : '#fef2f2' }}
                            onClick={() => handleRetire(asset)}
                            title={asset.status === 'assigned' ? "Must unassign to retire" : "Retire Asset"}
                            disabled={asset.status === 'assigned'}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="aa-cards">
              {filtered.map(asset => (
                <div key={asset.assetId} className="aa-card">
                  <div className="aa-card-top">
                    <div className="aa-card-name">
                      {asset.assetName}
                    </div>
                    <span className={`aa-badge aa-badge-${asset.status}`}>
                      {STATUS_LABELS[asset.status] || asset.status}
                    </span>
                  </div>
                  <div className="aa-card-row">
                    <span className="aa-type-chip">{asset.assetType}</span>
                    {asset.departmentName && (
                      <span className="aa-card-detail">
                        <strong>Dept:</strong> {asset.departmentName}
                      </span>
                    )}
                    {asset.assignedToUserName && (
                      <span className="aa-card-detail">
                        <strong>Assigned:</strong> {asset.assignedToUserName}
                      </span>
                    )}
                  </div>
                  <div className="aa-card-row">
                    {asset.serialNumber && (
                      <span className="aa-card-detail">
                        <strong>SN:</strong> {asset.serialNumber}
                      </span>
                    )}
                    {asset.cost != null && (
                      <span className="aa-card-detail">
                        <strong>Cost:</strong> {fmtCost(asset.cost)}
                      </span>
                    )}
                  </div>
                  <div className="aa-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="aa-card-detail">{asset.assetTag || '—'}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="aa-btn-refresh" 
                        style={{ padding: '4px 8px', fontSize: '12px' }} 
                        onClick={() => downloadQR(asset)}
                      >
                        <DownloadIcon /> QR
                      </button>
                      {isOwner && asset.status !== 'retired' && (
                        <button
                          className="aa-btn-refresh"
                          style={{ padding: '4px 8px', fontSize: '12px', color: asset.status === 'assigned' ? '#999' : '#dc2626', borderColor: asset.status === 'assigned' ? '#ccc' : '#fca5a5', backgroundColor: asset.status === 'assigned' ? '#f3f4f6' : '#fef2f2' }}
                          onClick={() => handleRetire(asset)}
                          disabled={asset.status === 'assigned'}
                          title={asset.status === 'assigned' ? "Must unassign to retire" : "Retire Asset"}
                        >
                          <TrashIcon /> Retire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Hidden QR Canvases for Download ── */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
              {filtered.map(asset => (
                <QRCodeCanvas 
                  key={`qr-${asset.assetId}`}
                  id={`qr-${asset.assetId}`}
                  value={generateQrText(asset)} 
                  size={180} 
                  level="M"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
