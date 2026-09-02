import { useEffect, useState, useCallback } from 'react';
import { getMaintenanceCostReport } from '../../services/maintenanceLogService';
import { exportRowsToCsv } from '../../utils/csvExport';
import './MaintenanceCostPage.css';

/* ── Skeleton row ────────────────────────────────────────── */
function SkeletonRows({ count = 5 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <tr key={i}>
          {[...Array(5)].map((__, j) => (
            <td key={j} style={{ padding: '14px 12px' }}>
              <div className="mc-skeleton" style={{ height: 14, width: j === 0 ? '80%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const fmtCurrency = (val) => {
  if (!val || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

const fmtDate = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function AssetCostRow({ item }) {
  const [expanded, setExpanded] = useState(false);

  const normalizedLabor = Number(item?.laborCost ?? (item?.partsCost == null ? (item?.totalCost ?? 0) : 0));
  const normalizedParts = Number(item?.partsCost ?? 0);
  const normalizedTotal = Number(item?.totalCost ?? (normalizedLabor + normalizedParts));

  return (
    <>
      <tr onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <td data-label="Asset">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: 'var(--mc-muted)', width: '12px' }}>
              {expanded ? '▼' : '►'}
            </span>
            <div>
              <div className="mc-asset-name">{item.assetName}</div>
              <div className="mc-asset-meta">Tag: {item.assetTag}</div>
            </div>
          </div>
        </td>
        <td data-label="Total Maintenance Events">{item.maintenanceCount}</td>
        <td data-label="Labour Cost" className="mc-cost-cell">
          {fmtCurrency(normalizedLabor)}
        </td>
        <td data-label="Parts Cost" className="mc-cost-cell">
          {fmtCurrency(normalizedParts)}
        </td>
        <td data-label="Total Cost" className="mc-cost-cell">
          {fmtCurrency(normalizedTotal)}
        </td>
      </tr>
      {expanded && (
        <tr className="mc-details-row">
          <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--mc-border)' }}>
            <div className="mc-details-container">
              {item.details && item.details.length > 0 ? (
                <table className="mc-details-table">
                  <thead>
                    <tr>
                      <th>Repair Date</th>
                      <th>Labour Cost</th>
                      <th>Parts Cost</th>
                      <th>Total Cost</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.details.map((d) => (
                      (() => {
                        const labor = Number(d?.laborCost ?? (d?.partsCost == null ? (d?.cost ?? 0) : 0));
                        const parts = Number(d?.partsCost ?? 0);
                        const total = Number(d?.cost ?? (labor + parts));
                        return (
                      <tr key={d.logId}>
                        <td>{fmtDate(d.repairDate)}</td>
                        <td className="mc-cost-cell" style={{ fontSize: '12px' }}>{fmtCurrency(labor)}</td>
                        <td className="mc-cost-cell" style={{ fontSize: '12px' }}>{fmtCurrency(parts)}</td>
                        <td className="mc-cost-cell" style={{ fontSize: '12px' }}>{fmtCurrency(total)}</td>
                        <td style={{ color: 'var(--mc-muted)' }}>{d.remarks || '—'}</td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="mc-empty-details">No log details found.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MaintenanceCostPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const PAGE_SIZE = 15;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (start, end, page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMaintenanceCostReport({
        startDate: start || undefined,
        endDate: end || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE
      });
      if (res?.isSuccess) {
        setData(res.data);
      } else {
        setError(res?.errorMessage || 'Failed to load maintenance cost report.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load maintenance cost report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(startDate, endDate, pageNumber);
  }, [startDate, endDate, pageNumber, load]);

  const handleApplyFilters = () => {
    setPageNumber(1);
    load(startDate, endDate, 1);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPageNumber(1);
    load('', '', 1);
  };

  const reportData = data?.data; // PagedResult

  const CSV_COLUMNS = [
    { key: 'assetName', label: 'Asset' },
    { key: 'assetTag', label: 'Asset Tag' },
    { key: 'maintenanceCount', label: 'Total Maintenance Events' },
    {
      key: 'laborCost',
      label: 'Labour Cost',
      format: (r) => Number(r?.laborCost ?? (r?.partsCost == null ? (r?.totalCost ?? 0) : 0)).toFixed(2),
    },
    { key: 'partsCost', label: 'Parts Cost', format: (r) => Number(r?.partsCost ?? 0).toFixed(2) },
    {
      key: 'totalCost',
      label: 'Total Cost',
      format: (r) => {
        const labor = Number(r?.laborCost ?? (r?.partsCost == null ? (r?.totalCost ?? 0) : 0));
        const parts = Number(r?.partsCost ?? 0);
        return Number(r?.totalCost ?? (labor + parts)).toFixed(2);
      },
    },
  ];

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await getMaintenanceCostReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        pageNumber: 1,
        pageSize: 10000,
      });
      if (!res?.isSuccess) {
        setError(res?.errorMessage || 'Failed to export report.');
        return;
      }
      const rows = res.data?.data?.items ?? [];
      if (rows.length === 0) {
        setError('Nothing to export.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      exportRowsToCsv(`maintenance-cost-report-${stamp}.csv`, rows, CSV_COLUMNS);
    } catch (err) {
      setError(err.message || 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page mc-page">

      {/* ── Page header ── */}
      <div className="mc-header">
        <div>
          <div className="mc-eyebrow">Reports · Admin</div>
          <h1 className="mc-title">Maintenance Cost Report</h1>
        </div>

        {/* Filter */}
        <div className="mc-filters">
          <div className="mc-filter-item">
            <label htmlFor="start-date-input">Start Date</label>
            <input
              type="date"
              id="start-date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mc-input"
            />
          </div>
          <div className="mc-filter-item">
            <label htmlFor="end-date-input">End Date</label>
            <input
              type="date"
              id="end-date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mc-input"
            />
          </div>
          <div className="mc-filter-actions">
            <button className="mc-btn mc-btn-primary" onClick={handleApplyFilters}>Apply</button>
            <button className="mc-btn mc-btn-secondary" onClick={clearFilters}>Clear</button>
            <button className="mc-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : '⬇️ Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && <div className="mc-alert">{error}</div>}

      <div className="mc-table-wrap">
        {!loading && reportData?.items?.length === 0 ? (
          <div className="mc-empty">No maintenance cost data found.</div>
        ) : (
          <>
            <table className="mc-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Total Maintenance Events</th>
                  <th>Labour Cost</th>
                  <th>Parts Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <SkeletonRows count={5} />
                  : reportData?.items?.map((item) => (
                    <AssetCostRow key={item.assetId} item={item} />
                  ))
                }
              </tbody>
            </table>

            {/* Pagination */}
            {reportData && reportData.totalPages > 1 && (
              <div className="mc-pagination">
                <button
                  className="mc-btn"
                  disabled={!reportData.hasPreviousPage}
                  onClick={() => setPageNumber((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span>Page {reportData.pageNumber} of {reportData.totalPages}</span>
                <button
                  className="mc-btn"
                  disabled={!reportData.hasNextPage}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
