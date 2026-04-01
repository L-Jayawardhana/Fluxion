import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api, { getAssets } from '../../services/api';
import { getMaintenanceLogPage } from '../../services/maintenanceLogService';
import { getMaintenanceTickets } from '../../services/maintenanceService';
import AssetInfoHeader from '../../components/MaintenanceLogs/AssetInfoHeader';
import SummaryStatsBar from '../../components/MaintenanceLogs/SummaryStatsBar';
import MaintenanceLogTable from '../../components/MaintenanceLogs/MaintenanceLogTable';
import CommentsPanel from '../../components/MaintenanceLogs/CommentsPanel';
import './MaintenanceLogPage.css';

const PAGE_SIZE = 10;

export default function MaintenanceLogPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const showSummary = role === 'owner' || role === 'admin' || role === 'systemadmin';
  const isOwner = role === 'owner' || role === 'admin' || role === 'systemadmin';
  const isTechnician = role === 'technician';
  const isEmployee = role === 'user' || role === 'employee';

  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assetOptions, setAssetOptions] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState('');
  const [commentTicketId, setCommentTicketId] = useState(null);

  const loadPage = async (page) => {
    if (!assetId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getMaintenanceLogPage(assetId, { pageNumber: page, pageSize: PAGE_SIZE });
      if (res?.isSuccess) {
        setData(res.data);
      } else {
        setError(res?.errorMessage || 'Failed to load maintenance log page.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load maintenance log page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageNumber(1);
  }, [assetId]);

  useEffect(() => {
    loadPage(pageNumber);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, pageNumber]);

  const ticketId = useMemo(() => {
    const fromLogs = data?.maintenanceLogs?.items?.[0]?.ticketId;
    const fromComments = data?.comments?.[0]?.ticketId;
    return fromLogs || fromComments || null;
  }, [data]);

  useEffect(() => {
    setCommentTicketId(null);
  }, [assetId]);

  useEffect(() => {
    if (ticketId) setCommentTicketId(ticketId);
  }, [ticketId]);

  useEffect(() => {
    if (!assetId || !isTechnician || commentTicketId) return;
    let cancelled = false;

    const loadAssignedTicket = async () => {
      try {
        const res = await getMaintenanceTickets({ assetId: Number(assetId), pageNumber: 1, pageSize: 1 });
        if (!cancelled && res?.isSuccess && res.data?.items?.length) {
          setCommentTicketId(res.data.items[0].ticketId);
        }
      } catch {
        // Ignore; comment box will show no ticket available.
      }
    };

    loadAssignedTicket();
    return () => { cancelled = true; };
  }, [assetId, isTechnician, commentTicketId]);

  useEffect(() => {
    if (assetId || !user?.orgId) return;
    let cancelled = false;

    const loadAssets = async () => {
      setAssetLoading(true);
      setAssetError('');
      try {
        let assets = [];
        if (isEmployee) {
          const res = await api.get(`/Asset/user/${user.userId}?orgId=${user.orgId}`);
          assets = res.data || [];
        } else {
          assets = await getAssets(user.orgId);
        }
        if (!cancelled) setAssetOptions(assets || []);
      } catch (err) {
        if (!cancelled) setAssetError('Failed to load assets.');
      } finally {
        if (!cancelled) setAssetLoading(false);
      }
    };

    loadAssets();
    return () => { cancelled = true; };
  }, [assetId, user, isEmployee, isOwner, isTechnician]);

  const statusClass = (value) => {
    const v = String(value || '').toLowerCase();
    if (v === 'available') return 'ml-badge status-available';
    if (v === 'assigned') return 'ml-badge status-assigned';
    if (v === 'under_maintenance') return 'ml-badge status-maintenance';
    if (v === 'retired') return 'ml-badge status-retired';
    return 'ml-badge status-unknown';
  };

  const fmtStatus = (value) => String(value || '').replace(/_/g, ' ');

  if (!assetId) {
    return (
      <div className="page ml-page">
        <div className="ml-header">
          <div>
            <div className="ml-eyebrow">Maintenance Log</div>
            <h1 className="ml-title">Select an asset to view its maintenance log</h1>
          </div>
        </div>

        {assetError && <div className="ml-alert">{assetError}</div>}

        <div className="ml-picker">
          <div className="ml-picker-grid">
            {assetLoading && [...Array(6)].map((_, i) => (
              <div key={i} className="ml-picker-card ml-picker-skeleton">
                <div className="ml-skeleton" style={{ height: 18, width: '70%' }} />
                <div className="ml-skeleton" style={{ height: 12, width: '50%' }} />
                <div className="ml-skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            ))}

            {!assetLoading && assetOptions.length === 0 && (
              <div className="ml-empty">No assets available for maintenance logs.</div>
            )}

            {!assetLoading && assetOptions.map((asset) => (
              <button
                key={asset.assetId}
                type="button"
                className="ml-picker-card"
                onClick={() => navigate(`/maintenance-logs/${asset.assetId}`)}
              >
                <div className="ml-picker-name">{asset.assetName}</div>
                <div className="ml-picker-meta">Type: {asset.assetType || asset.category || 'N/A'}</div>
                <div className="ml-picker-meta">Serial: {asset.serialNumber || 'N/A'}</div>
                <div className="ml-picker-meta">
                  <span className={statusClass(asset.status || asset.currentStatus)}>
                    {fmtStatus(asset.status || asset.currentStatus || 'unknown')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page ml-page">
      <div className="ml-header">
        <div>
          <div className="ml-eyebrow">Maintenance Log</div>
          <h1 className="ml-title">Asset history and technician notes</h1>
        </div>
        <div className="ml-asset-chip">Asset #{assetId}</div>
      </div>

      {error && (
        <div className="ml-alert">{error}</div>
      )}

      <AssetInfoHeader assetInfo={data?.assetInfo} role={role} loading={loading} />
      <SummaryStatsBar summaryStats={showSummary ? data?.summaryStats : null} loading={showSummary && loading} />
      <MaintenanceLogTable
        maintenanceLogs={data?.maintenanceLogs}
        role={role}
        loading={loading}
        onPageChange={setPageNumber}
      />
      <CommentsPanel
        comments={data?.comments}
        role={role}
        loading={loading}
        ticketId={commentTicketId}
      />
    </div>
  );
}
