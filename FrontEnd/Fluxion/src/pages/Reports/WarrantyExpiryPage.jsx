import { useEffect, useState, useCallback } from 'react';
import { getWarrantyExpiryReport, notifyWarrantyExpiry } from '../../services/warrantyService';
import './WarrantyExpiryPage.css';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDate = (v) => {
  if (!v) return 'N/A';
  return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtStatus = (v) =>
  String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Width % for the days-remaining bar (0–100). Max window = 730 days. */
const barWidth = (days) => {
  if (days <= 0) return 100;
  return Math.min(100, Math.round((days / 730) * 100));
};

/* ── Skeleton row ────────────────────────────────────────── */
function SkeletonRows({ count = 5 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <tr key={i}>
          {[...Array(7)].map((__, j) => (
            <td key={j} style={{ padding: '14px 12px' }}>
              <div className="wr-skeleton" style={{ height: 14, width: j === 0 ? '80%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Summary stat card ───────────────────────────────────── */
function StatCard({ label, value, type }) {
  return (
    <div className={`wr-stat-card ${type}`}>
      <div className="wr-stat-label">{label}</div>
      <div className="wr-stat-value">{value}</div>
    </div>
  );
}

/* ── Asset row ───────────────────────────────────────────── */
function AssetRow({ asset, onNotify, notifyingId }) {
  const level = asset.urgencyLevel || 'Upcoming';
  const days = asset.daysUntilExpiry;
  const daysLabel = days < 0
    ? `Expired ${Math.abs(days)}d ago`
    : `${days}d remaining`;

  return (
    <tr>
      <td data-label="Asset">
        <div className="wr-asset-name">{asset.assetName}</div>
        <div className="wr-asset-meta">SN: {asset.serialNumber || 'N/A'} · {asset.assetType}</div>
      </td>
      <td data-label="Department">{asset.departmentName || '—'}</td>
      <td data-label="Assigned To">{asset.assignedToName || '—'}</td>
      <td data-label="Status">
        <span className={`wr-status ${(asset.currentStatus || '').toLowerCase()}`}>
          {fmtStatus(asset.currentStatus)}
        </span>
      </td>
      <td data-label="Warranty End">{fmtDate(asset.warrantyEndDate)}</td>
      <td data-label="Days">
        <div className={`wr-days ${level}`}>{daysLabel}</div>
        <div className="wr-days-bar-wrap">
          <div
            className={`wr-days-bar ${level}`}
            style={{ width: level === 'Expired' ? '100%' : `${barWidth(days)}%` }}
          />
        </div>
      </td>
      <td data-label="Urgency">
        <span className={`wr-urgency ${level}`}>{level}</span>
      </td>
      <td data-label="Actions">
        <button
          className="wr-btn"
          onClick={() => onNotify(asset.assetId)}
          disabled={notifyingId === asset.assetId}
          style={{ padding: '6px 10px', fontSize: '11px' }}
        >
          {notifyingId === asset.assetId ? 'Wait...' : '✉️ Email'}
        </button>
      </td>
    </tr>
  );
}

/* ── Main page ───────────────────────────────────────────── */
const DAYS_OPTIONS = [
  { value: 30,  label: 'Next 30 days' },
  { value: 60,  label: 'Next 60 days' },
  { value: 90,  label: 'Next 90 days' },
  { value: 180, label: 'Next 6 months' },
  { value: 365, label: 'Next 12 months' },
  { value: 730, label: 'Next 2 years' },
];

export default function WarrantyExpiryPage() {
  const [daysAhead, setDaysAhead]           = useState(90);
  const [pageNumber, setPageNumber]         = useState(1);
  const PAGE_SIZE = 15;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [notifyingId, setNotifyingId] = useState(null);
  const [toast, setToast]     = useState(null);

  const pushToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNotify = async (assetId) => {
    setNotifyingId(assetId);
    try {
      const res = await notifyWarrantyExpiry(assetId);
      if (res?.isSuccess) {
        pushToast('success', 'Warranty notice email sent.');
      } else {
        pushToast('error', res?.errorMessage || 'Failed to send email.');
      }
    } catch (err) {
      pushToast('error', err.message || 'Failed to send email.');
    } finally {
      setNotifyingId(null);
    }
  };

  const load = useCallback(async (days, page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getWarrantyExpiryReport({ daysAhead: days, pageNumber: page, pageSize: PAGE_SIZE });
      if (res?.isSuccess) {
        setData(res.data);
      } else {
        setError(res?.errorMessage || 'Failed to load warranty report.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load warranty report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(daysAhead, pageNumber);
  }, [daysAhead, pageNumber, load]);

  const handleDaysChange = (e) => {
    setDaysAhead(Number(e.target.value));
    setPageNumber(1);
  };

  const summary = data?.summary;
  const expiring = data?.expiring;
  const expired  = data?.expired ?? [];

  return (
    <div className="page wr-page">

      {/* ── Page header ── */}
      <div className="wr-header">
        <div>
          <div className="wr-eyebrow">Reports · Owner</div>
          <h1 className="wr-title">Warranty Expiry Report</h1>
        </div>

        {/* Filter */}
        <div className="wr-filters">
          <label htmlFor="wr-days-select">Expiry window</label>
          <select
            id="wr-days-select"
            className="wr-select"
            value={daysAhead}
            onChange={handleDaysChange}
          >
            {DAYS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error/Toast banner ── */}
      {error && <div className="wr-alert">{error}</div>}
      {toast && (
        <div className="wr-alert" style={{ 
          borderColor: toast.type === 'success' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)', 
          background: toast.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)' 
        }}>
          {toast.message}
        </div>
      )}

      {/* ── Summary stat cards ── */}
      <div className="wr-stats">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="wr-stat-card">
              <div className="wr-skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
              <div className="wr-skeleton" style={{ height: 28, width: '40%' }} />
            </div>
          ))
        ) : summary ? (
          <>
            <StatCard label="Total With Warranty" value={summary.totalWithWarranty}   type="total" />
            <StatCard label="Already Expired"      value={summary.alreadyExpiredCount} type="expired" />
            <StatCard label="Expiring ≤ 30 days"   value={summary.expiringSoonCount}   type="critical" />
            <StatCard label="Expiring ≤ 1 year"    value={summary.expiringThisYear}    type="warning" />
            <StatCard label="Healthy (>1 year)"    value={summary.healthyCount}        type="healthy" />
          </>
        ) : null}
      </div>

      {/* ── Expiring soon (within window) ── */}
      <div className="wr-section-title">
        Expiring Soon
        {expiring && (
          <span className="wr-section-badge expiring">
            {expiring.totalCount} asset{expiring.totalCount !== 1 ? 's' : ''} in next {daysAhead} days
          </span>
        )}
      </div>

      <div className="wr-table-wrap">
        {!loading && expiring?.items?.length === 0 ? (
          <div className="wr-empty">🎉 No warranties expiring in the next {daysAhead} days.</div>
        ) : (
          <>
            <table className="wr-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Warranty End</th>
                  <th>Days</th>
                  <th>Urgency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <SkeletonRows count={5} />
                  : expiring?.items?.map((a) => <AssetRow key={a.assetId} asset={a} onNotify={handleNotify} notifyingId={notifyingId} />)
                }
              </tbody>
            </table>

            {/* Pagination */}
            {expiring && expiring.totalPages > 1 && (
              <div className="wr-pagination">
                <button
                  className="wr-btn"
                  disabled={!expiring.hasPreviousPage}
                  onClick={() => setPageNumber((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span>Page {expiring.pageNumber} of {expiring.totalPages}</span>
                <button
                  className="wr-btn"
                  disabled={!expiring.hasNextPage}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Already expired ── */}
      <div className="wr-section-title">
        Already Expired
        {!loading && (
          <span className="wr-section-badge expired">
            {expired.length} asset{expired.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="wr-table-wrap">
        {!loading && expired.length === 0 ? (
          <div className="wr-empty">✅ No expired warranties on record.</div>
        ) : (
          <table className="wr-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Department</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Warranty Ended</th>
                <th>Days Overdue</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <SkeletonRows count={4} />
                : expired.map((a) => <AssetRow key={a.assetId} asset={a} onNotify={handleNotify} notifyingId={notifyingId} />)
              }
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
