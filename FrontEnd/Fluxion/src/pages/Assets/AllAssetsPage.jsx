import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrganizations, getDepartments, getAssets } from '../../services/api';
import './AllAssetsPage.css';

/* ── SVG Icons ───────────────────────────────────────────── */
const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M8 1v14M1 8h14" strokeLinecap="round"/>
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 8a7 7 0 0013.3-3M15 8A7 7 0 001.7 11" strokeLinecap="round"/>
    <path d="M12 1l2.3 4-4 .3M4 15l-2.3-4 4-.3" strokeLinecap="round" strokeLinejoin="round"/>
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

const TYPE_EMOJIS = {
  Laptop: '💻', Desktop: '🖥️', Monitor: '🖥️', Printer: '🖨️',
  Phone: '📱', Tablet: '📱', Vehicle: '🚗', Furniture: '🪑',
  Networking: '🌐', Other: '📦',
};

const fmtCost = (cost) =>
  cost != null ? `$${Number(cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

/* ████████████████████████████████████████████████████████████ */
export default function AllAssetsPage() {
  const { user } = useAuth();

  const [userOrg, setUserOrg]         = useState(null);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Filters
  const [filterDept, setFilterDept]   = useState('');
  const [filterType, setFilterType]   = useState('');

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
    return list;
  }, [assets, filterDept, filterType]);

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

  const clearFilters = () => { setFilterDept(''); setFilterType(''); };
  const hasFilters = filterDept || filterType;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="page aa-page">

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
          <Link to="/register-asset" className="aa-btn-add">
            <PlusIcon /> Register Asset
          </Link>
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
            <div className="aa-empty-icon">📦</div>
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
                    <th>Serial / Tag</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(asset => (
                    <tr key={asset.assetId}>
                      <td>
                        <div className="aa-asset-name">{asset.assetName}</div>
                        {asset.qrCode && (
                          <div className="aa-asset-tag">{asset.qrCode}</div>
                        )}
                      </td>
                      <td>
                        <span className="aa-type-chip">
                          {TYPE_EMOJIS[asset.assetType] || '📦'} {asset.assetType}
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
                        <div className="aa-asset-tag">
                          {asset.serialNumber || asset.assetTag || '—'}
                        </div>
                      </td>
                      <td>
                        <span className="aa-cost">{fmtCost(asset.cost)}</span>
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
                      {TYPE_EMOJIS[asset.assetType] || '📦'} {asset.assetName}
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
                  <div className="aa-card-meta">
                    <span className="aa-card-detail">{asset.qrCode}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
