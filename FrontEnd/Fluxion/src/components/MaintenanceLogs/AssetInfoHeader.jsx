import React from 'react';

const fmtStatus = (value) => {
  if (!value) return 'Unknown';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusClass = (value) => {
  const v = String(value || '').toLowerCase();
  if (v === 'available') return 'ml-badge status-available';
  if (v === 'assigned') return 'ml-badge status-assigned';
  if (v === 'under_maintenance') return 'ml-badge status-maintenance';
  if (v === 'retired') return 'ml-badge status-retired';
  return 'ml-badge status-unknown';
};

const conditionClass = (value) => {
  const v = String(value || '').toLowerCase();
  if (v === 'good') return 'ml-badge cond-good';
  if (v === 'fair') return 'ml-badge cond-fair';
  if (v === 'poor') return 'ml-badge cond-poor';
  if (v === 'critical') return 'ml-badge cond-critical';
  return 'ml-badge cond-unknown';
};

export default function AssetInfoHeader({ assetInfo, role, loading }) {
  const isOwner = role === 'owner' || role === 'admin' || role === 'systemadmin' || role === 'manager';

  if (loading) {
    return (
      <div className="ml-asset-hero">
        <div className="ml-asset-title">
          <div className="ml-skeleton" style={{ height: 28, width: '60%' }} />
          <div className="ml-skeleton" style={{ height: 14, width: '30%' }} />
        </div>
        <div className="ml-asset-badges">
          <div className="ml-skeleton" style={{ height: 20, width: 90 }} />
          <div className="ml-skeleton" style={{ height: 20, width: 90 }} />
        </div>
        <div className="ml-asset-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ml-skeleton" style={{ height: 16, width: '80%' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!assetInfo) return null;

  return (
    <div className="ml-asset-hero">
      <div className="ml-asset-title">
        <div className="ml-asset-name">{assetInfo.assetName}</div>
        <div className="ml-asset-meta">Serial: {assetInfo.serialNumber || 'N/A'} - Category: {assetInfo.category}</div>
      </div>
      <div className="ml-asset-badges">
        <span className={statusClass(assetInfo.currentStatus)}>{fmtStatus(assetInfo.currentStatus)}</span>
        <span className={conditionClass(assetInfo.currentCondition)}>{fmtStatus(assetInfo.currentCondition)}</span>
      </div>
      <div className="ml-asset-grid">
        <div>
          <div className="ml-asset-label">Assigned To</div>
          <div className="ml-asset-value">{assetInfo.assignedTo || 'Unassigned'}</div>
        </div>
        <div>
          <div className="ml-asset-label">Last Inspected</div>
          <div className="ml-asset-value">
            {assetInfo.lastInspectedAt
              ? new Date(assetInfo.lastInspectedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
              : 'No inspection data'}
          </div>
        </div>
        <div>
          <div className="ml-asset-label">Asset ID</div>
          <div className="ml-asset-value">#{assetInfo.assetId}</div>
        </div>
        <div>
          <div className="ml-asset-label">Status</div>
          <div className="ml-asset-value">{fmtStatus(assetInfo.currentStatus)}</div>
        </div>
        {isOwner && (
          <div>
            <div className="ml-asset-label">Department</div>
            <div className="ml-asset-value">{assetInfo.departmentName || 'Unassigned'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
