import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { getFinancialInsightsReport } from '../../services/maintenanceLogService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import InviteUserModal from './InviteUserModal';
import './DashboardPage.css';

/* ── Animated counter ────────────────────────────────────── */
function AnimVal({ val, suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const dur = 1200;
    const t0 = performance.now();
    const end = val;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(ease * end) + suffix;
      if (p < 1) frame = requestAnimationFrame(step);
    }
    const timer = setTimeout(() => { frame = requestAnimationFrame(step); }, 300);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [val, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ── Helpers ──────────────────────────────────────────────── */

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const getTokenOrgIdFallback = () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const rawOrgId = payload?.OrgId ?? payload?.orgId ?? null;
    if (rawOrgId === null || rawOrgId === '') return null;
    const parsed = Number(rawOrgId);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Financial Insights Sub-Page ──────────────────────────── */
const FinancialInsights = memo(function FinancialInsights({ insights: initialInsights, loading: initialLoading, error: initialError, orgId }) {
  const [data, setData] = useState(initialInsights);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync initial loading metrics if we haven't filtered
  useEffect(() => {
    if (!startDate && !endDate) {
      setData(initialInsights);
      setLoading(initialLoading);
      setError(initialError);
    }
  }, [initialInsights, initialLoading, initialError, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFinancialInsightsReport({
        orgId: orgId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res?.isSuccess === false) {
        setError(res?.errorMessage || 'Failed to load financial insights');
        setData(null);
      } else {
        const payload = res?.data ?? res;
        setData(payload || null);
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || err.message || 'Failed to load financial insights');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed / normalised data arrays (must be declared BEFORE export handlers) ──

  const costPerAsset = (data?.costPerAsset || []).map((a) => {
    const labor = Number(a?.laborCost ?? 0);
    const parts = Number(a?.partsCost ?? 0);
    const maintenance = Number(a?.maintenanceCost ?? (labor + parts));
    const total = Number(a?.totalCost ?? 0);
    const initial = Number(a?.purchaseCost ?? Math.max(total - maintenance, 0));
    return { ...a, laborCost: labor, partsCost: parts, maintenanceCost: maintenance, purchaseCost: initial, totalCost: total };
  });

  const spendByDepartment = (data?.spendByDepartment || []).map((d) => {
    const maintenance = Number(d?.maintenanceSpend ?? 0);
    const fallbackLabour = d?.laborSpend == null && d?.partsSpend == null ? maintenance : 0;
    return {
      ...d,
      laborSpend: Number(d?.laborSpend ?? fallbackLabour),
      partsSpend: Number(d?.partsSpend ?? 0),
      maintenanceSpend: Number(d?.maintenanceSpend ?? Number(d?.laborSpend ?? 0) + Number(d?.partsSpend ?? 0)),
      totalSpend: Number(d?.totalSpend ?? 0),
    };
  });

  const costPerTechnician = (data?.costPerTechnician || []).map((t) => {
    const total = Number(t?.totalCost ?? 0);
    const fallbackLabour = t?.laborCost == null && t?.partsCost == null ? total : 0;
    return { ...t, laborCost: Number(t?.laborCost ?? fallbackLabour), partsCost: Number(t?.partsCost ?? 0), totalCost: total };
  });

  const monthlyTrends = (data?.monthlyTrends || []).map((m) => {
    const total = Number(m?.spend ?? 0);
    const fallbackLabour = m?.laborSpend == null && m?.partsSpend == null ? total : 0;
    return { ...m, laborSpend: Number(m?.laborSpend ?? fallbackLabour), partsSpend: Number(m?.partsSpend ?? 0), spend: total };
  });

  const totalCost = data?.budgetComparison?.actualSpend
    ?? costPerAsset.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  const formatCurrency = (v) => `$${(Number(v) || 0).toFixed(2)}`;
  const reportDateRange = startDate || endDate
    ? `${startDate || 'Start'} to ${endDate || 'Present'}`
    : 'All Time';

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    // ── Cover header
    doc.setFillColor(200, 75, 47);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Insights Report', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${reportDateRange}   |   Generated: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.setTextColor(30, 30, 30);
    y = 38;

    // ── Summary KPIs
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Organisation Spend (Actual)', formatCurrency(totalCost)],
        ['Total Budget', formatCurrency(data.budgetComparison?.totalBudget)],
        ['Actual Spend', formatCurrency(data.budgetComparison?.actualSpend)],
        ['Budget Variance', formatCurrency(data.budgetComparison?.variance)],
      ],
      headStyles: { fillColor: [200, 75, 47] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // ── Cost Breakdown by Asset
    if (costPerAsset.length > 0) {
      if (y > 240) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.text('Cost Breakdown by Asset', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Asset Name', 'Initial Cost', 'Labour', 'Parts', 'Total Maintenance', 'Total Cost']],
        body: costPerAsset.map(a => [
          a.assetName || '—',
          formatCurrency(a.purchaseCost),
          formatCurrency(a.laborCost),
          formatCurrency(a.partsCost),
          formatCurrency(a.maintenanceCost),
          formatCurrency(a.totalCost),
        ]),
        headStyles: { fillColor: [42, 111, 200] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Spend by Department
    if (spendByDepartment.length > 0) {
      if (y > 240) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.text('Spend by Department', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Department', 'Labour', 'Parts', 'Total Maintenance', 'Total Spend']],
        body: spendByDepartment.map(d => [
          d.departmentName || '—',
          formatCurrency(d.laborSpend),
          formatCurrency(d.partsSpend),
          formatCurrency(d.maintenanceSpend),
          formatCurrency(d.totalSpend),
        ]),
        headStyles: { fillColor: [42, 111, 200] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Cost per Technician
    if (costPerTechnician.length > 0) {
      if (y > 240) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.text('Cost per Technician', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Technician', 'Labour', 'Parts', 'Total']],
        body: costPerTechnician.map(t => [
          t.technicianName || '—',
          formatCurrency(t.laborCost),
          formatCurrency(t.partsCost),
          formatCurrency(t.totalCost),
        ]),
        headStyles: { fillColor: [42, 111, 200] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Monthly Spend Trends
    if (monthlyTrends.length > 0) {
      if (y > 240) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Spend Trends', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Labour', 'Parts', 'Total']],
        body: monthlyTrends.map(m => [
          m.month || '—',
          formatCurrency(m.laborSpend),
          formatCurrency(m.partsSpend),
          formatCurrency(m.spend),
        ]),
        headStyles: { fillColor: [42, 111, 200] },
        margin: { left: 14, right: 14 },
      });
    }

    // ── Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Fluxion · Financial Insights · Page ${p} of ${totalPages}`, 14, doc.internal.pageSize.getHeight() - 8);
    }

    doc.save(`Financial_Insights_${(startDate || 'All').replace(/-/g,'')}_${(endDate || 'All').replace(/-/g,'')}.pdf`);
  };

  // ── Excel Export ─────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1 – Summary
    const summaryRows = [
      ['Financial Insights Report'],
      [`Period: ${reportDateRange}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Organisation Spend (Actual)', totalCost],
      ['Total Budget', data.budgetComparison?.totalBudget ?? ''],
      ['Actual Spend', data.budgetComparison?.actualSpend ?? ''],
      ['Budget Variance', data.budgetComparison?.variance ?? ''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

    // Sheet 2 – Cost by Asset
    if (costPerAsset.length > 0) {
      const assetRows = [
        ['Asset Name', 'Initial Cost ($)', 'Labour Cost ($)', 'Parts Cost ($)', 'Total Maintenance ($)', 'Total Cost ($)'],
        ...costPerAsset.map(a => [
          a.assetName || '',
          a.purchaseCost,
          a.laborCost,
          a.partsCost,
          a.maintenanceCost,
          a.totalCost,
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assetRows), 'Cost by Asset');
    }

    // Sheet 3 – Spend by Department
    if (spendByDepartment.length > 0) {
      const deptRows = [
        ['Department', 'Labour ($)', 'Parts ($)', 'Total Maintenance ($)', 'Total Spend ($)'],
        ...spendByDepartment.map(d => [
          d.departmentName || '',
          d.laborSpend,
          d.partsSpend,
          d.maintenanceSpend,
          d.totalSpend,
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptRows), 'Spend by Department');
    }

    // Sheet 4 – Cost per Technician
    if (costPerTechnician.length > 0) {
      const techRows = [
        ['Technician', 'Labour ($)', 'Parts ($)', 'Total ($)'],
        ...costPerTechnician.map(t => [
          t.technicianName || '',
          t.laborCost,
          t.partsCost,
          t.totalCost,
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(techRows), 'Cost per Technician');
    }

    // Sheet 5 – Monthly Trends
    if (monthlyTrends.length > 0) {
      const trendRows = [
        ['Month', 'Labour ($)', 'Parts ($)', 'Total ($)'],
        ...monthlyTrends.map(m => [
          m.month || '',
          m.laborSpend,
          m.partsSpend,
          m.spend,
        ])
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trendRows), 'Monthly Trends');
    }

    XLSX.writeFile(wb, `Financial_Insights_${(startDate || 'All').replace(/-/g,'')}_${(endDate || 'All').replace(/-/g,'')}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--db-border)', background: 'var(--db-surface)' }}
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--db-border)', background: 'var(--db-surface)' }}
        />
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--db-text)', color: 'var(--db-bg)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          onClick={loadData}>Apply</button>
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--db-border)', color: 'var(--db-text)', fontWeight: 500, cursor: 'pointer' }}
          onClick={handleExportPDF}>Export PDF</button>
        <button 
          style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--db-border)', color: 'var(--db-text)', fontWeight: 500, cursor: 'pointer' }}
          onClick={handleExportExcel}>Export Excel</button>
      </div>

      {error && (
        <div className="db-panel" style={{ borderLeft: '3px solid var(--db-rust)' }}>
          <div className="db-panel-body" style={{ color: 'var(--db-rust)', fontWeight: 600 }}>
            {error}
          </div>
        </div>
      )}

      <div className="db-kpi-grid">
        <div className="db-kpi db-kpi-rust">
          <div className="db-kpi-icon">💰</div>
          <div className="db-kpi-label">Total Organization Spend</div>
          <div className="db-kpi-value"><AnimVal val={totalCost} suffix="" /></div>
          <div className="db-kpi-sub">Lifetime maintenance cost (includes external parts)</div>
        </div>
      </div>

      {loading && (
        <div className="db-panel">
          <div className="db-panel-body" style={{ textAlign: 'center', opacity: 0.7 }}>Loading financial insights...</div>
        </div>
      )}
      
      <div className="db-panel">
        <div className="db-panel-head">
          <span className="db-panel-title">Cost Breakdown by Asset</span>
        </div>
        <div className="db-panel-body" style={{ paddingTop: 8 }}>
          <table className="db-ticket-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Initial Cost</th>
                <th>Labour</th>
                <th>Parts</th>
                <th>Total Maintenance</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {costPerAsset.map((r, idx) => (
                <tr key={`${r.assetName}-${idx}`}>
                  <td>{r.assetName}</td>
                  <td>${(r.purchaseCost || 0).toFixed(2)}</td>
                  <td>${(r.laborCost || 0).toFixed(2)}</td>
                  <td>${(r.partsCost || 0).toFixed(2)}</td>
                  <td>${(r.maintenanceCost || 0).toFixed(2)}</td>
                  <td style={{color: 'var(--db-rust)', fontWeight: 600}}>${r.totalCost?.toFixed(2)}</td>
                </tr>
              ))}
              {costPerAsset.length === 0 && !loading && (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No financial data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="db-row db-row-3-2 db-d6">
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Spend by Department</span>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <table className="db-ticket-table">
              <thead><tr><th>Department</th><th>Labour</th><th>Parts</th><th>Total Maintenance</th><th>Total Spend</th></tr></thead>
              <tbody>
                {spendByDepartment.map((d, idx) => (
                  <tr key={`${d.departmentName}-${idx}`}>
                    <td>{d.departmentName}</td>
                    <td>${(d.laborSpend || 0).toFixed(2)}</td>
                    <td>${(d.partsSpend || 0).toFixed(2)}</td>
                    <td>${(d.maintenanceSpend || 0).toFixed(2)}</td>
                    <td>${(d.totalSpend || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {spendByDepartment.length === 0 && !loading && <tr><td colSpan="5" style={{textAlign:'center'}}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Cost per Technician</span>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <table className="db-ticket-table">
              <thead><tr><th>Technician</th><th>Labour</th><th>Parts</th><th>Total</th></tr></thead>
              <tbody>
                {costPerTechnician.map((t, idx) => (
                  <tr key={`${t.technicianName}-${idx}`}>
                    <td>{t.technicianName}</td>
                    <td>${(t.laborCost || 0).toFixed(2)}</td>
                    <td>${(t.partsCost || 0).toFixed(2)}</td>
                    <td>${(t.totalCost || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {costPerTechnician.length === 0 && !loading && <tr><td colSpan="4" style={{textAlign:'center'}}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="db-panel">
        <div className="db-panel-head">
          <span className="db-panel-title">Monthly Maintenance Trends (incl. external parts)</span>
        </div>
        <div className="db-panel-body" style={{ paddingTop: 8 }}>
          <table className="db-ticket-table">
            <thead><tr><th>Month</th><th>Labour</th><th>Parts</th><th>Total</th></tr></thead>
            <tbody>
              {monthlyTrends.map((m, idx) => (
                <tr key={`${m.month}-${idx}`}>
                  <td>{m.month}</td>
                  <td>${(m.laborSpend || 0).toFixed(2)}</td>
                  <td>${(m.partsSpend || 0).toFixed(2)}</td>
                  <td>${(m.spend || 0).toFixed(2)}</td>
                </tr>
              ))}
              {monthlyTrends.length === 0 && !loading && <tr><td colSpan="4" style={{textAlign:'center'}}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

/* ── Memoised heavy sub-components ────────────────────────── */
const TicketTable = memo(function TicketTable({ tickets }) {
  return (
    <table className="db-ticket-table">
      <thead>
        <tr>
          <th>Asset</th><th>Issue Title</th><th>Status</th><th>Priority</th><th>Logged</th><th></th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t, i) => {
          let statusColor = 'open';
          if (t.status === 2) statusColor = 'prog';
          if (t.status >= 3) statusColor = 'done';
          return (
          <tr key={t.ticketId || i}>
            <td><div className="db-t-asset">Asset #{t.assetId}</div></td>
            <td><div className="db-t-issue">{t.title}</div></td>
            <td><span className={`db-badge db-badge-${statusColor}`}>{t.status === 1 ? 'Open' : t.status === 2 ? 'Assigned' : 'Resolved'}</span></td>
            <td><span className={`db-priority db-priority-${t.priority === 1 ? 'crit' : 'med'}`}>Priority {t.priority}</span></td>
            <td className="db-t-age">{fmtDate(t.createdAt)}</td>
            <td><button className="db-t-action"><ArrowIcon /></button></td>
          </tr>
        )})}
        {tickets.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No open tickets</td></tr>}
      </tbody>
    </table>
  );
});

const AssetList = memo(function AssetList({ assets }) {
  return (
    <div className="db-asset-list">
      {assets.slice(0, 5).map((a, i) => (
        <div className="db-asset-item" key={i}>
          <div className="db-asset-thumb">💻</div>
          <div className="db-asset-info">
            <div className="db-asset-name">{a.assetName}</div>
            <div className="db-asset-meta">SN: {a.serialNumber || 'N/A'}</div>
          </div>
          <span className={`db-badge db-badge-${a.status?.toLowerCase() === 'available' ? 'done' : 'open'}`}>{a.status}</span>
        </div>
      ))}
      {assets.length === 0 && <div style={{padding:'20px', textAlign:'center'}}>No assets found</div>}
    </div>
  );
});

const EmployeeDashboardPage = () => (
  <div className="tc-page" style={{padding: '40px', textAlign: 'center'}}>
    <h2>Welcome to the Employee Portal</h2>
    <p style={{opacity: 0.7}}>Access your assigned assets and maintenance requests from the sidebar.</p>
  </div>
);


/* ████████████████████████████████████████████████████████████ */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Employee users render a dedicated dashboard view.
  const isEmployee = user?.role?.toLowerCase() === 'user';

  const [dashboardData, setDashboardData] = useState({
    users: [],
    assets: [],
    tickets: [],
    costReport: []
  });
  const [financialInsights, setFinancialInsights] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const barRefs = useRef([]);
  const deptRefs = useRef([]);
  const mounted = useRef(false);

  const currentOrgId = user?.orgId ?? getTokenOrgIdFallback();


  /* ── Fetch data (non-blocking — page renders instantly) ── */
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setFinancialLoading(true);
        setFinancialError('');

        const usersRes = await api.get('/User', {
          params: { orgId: currentOrgId }
        });

        const users = Array.isArray(usersRes?.data)
          ? usersRes.data
          : usersRes?.data?.data || [];

        const resolvedOrgId =
          currentOrgId ||
          Number(users.find(u => String(u.userId) === String(user?.userId))?.orgId) ||
          Number(users[0]?.orgId) ||
          null;

        const [aRes, tRes, cRes, fRes] = await Promise.allSettled([
          resolvedOrgId
            ? api.get('/Asset', { params: { orgId: resolvedOrgId } })
            : Promise.resolve({ data: [] }),
          api.get('/maintenance-tickets', { params: { pageSize: 100 } }),
          api.get('/Maintenance/reports/cost', { params: { pageSize: 100 } }),
          getFinancialInsightsReport({ orgId: resolvedOrgId || undefined })
        ]);

        if (cancelled) return;

        const assets = aRes.status === 'fulfilled'
          ? (Array.isArray(aRes.value?.data) ? aRes.value.data : (aRes.value?.data?.data || []))
          : [];

        const tickets = tRes.status === 'fulfilled'
          ? (tRes.value?.data?.data?.items || tRes.value?.data?.items || [])
          : [];

        const costReport = cRes.status === 'fulfilled'
          ? (cRes.value?.data?.data?.data?.items || cRes.value?.data?.data?.items || [])
          : [];

        if (fRes.status === 'fulfilled') {
          const payload = fRes.value?.data ?? fRes.value;
          if (payload?.isSuccess === false) {
            setFinancialError(payload?.errorMessage || 'Failed to load financial insights');
            setFinancialInsights(null);
          } else {
            setFinancialInsights(payload?.data ?? payload ?? null);
          }
        } else {
          setFinancialError('Failed to load financial insights');
          setFinancialInsights(null);
        }

        setDashboardData({
          users,
          assets,
          tickets,
          costReport
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setFinancialError('Failed to load financial insights');
      } finally {
        if (!cancelled) setFinancialLoading(false);
      }
    };
    
    loadData();
    return () => { cancelled = true; };
  }, [currentOrgId, user?.userId]);

  /* ── KPI data ── */
  const activeUsers = dashboardData.users.filter(u => u.isActive).length;
  const underMaintenance = dashboardData.assets.filter(a => {
    const s = a.status?.toLowerCase();
    return s === 'under_maintenance' || s === 'undermaintenance';
  }).length;
  const openTicketsCount = dashboardData.tickets.filter(t => t.status === 1 || t.status === 2).length;

  const kpis = useMemo(() => [
    { color: 'blue', emoji: '💻', label: 'Total Assets', val: dashboardData.assets.length, delta: '—', deltaCls: 'up', sub: 'in organisation' },
    { color: 'rust', emoji: '🎫', label: 'Open Tickets', val: openTicketsCount, delta: '—', deltaCls: 'down', sub: 'pending fixes' },
    { color: 'amber', emoji: '🔧', label: 'Under Maintenance', val: underMaintenance, delta: '—', deltaCls: 'up', sub: 'currently deployed' },
    { color: 'green', emoji: '👥', label: 'Active Users', val: activeUsers, delta: '—', deltaCls: 'up', sub: 'in system' },
  ], [dashboardData.assets.length, openTicketsCount, underMaintenance, activeUsers]);

  /* ── Dynamic Donut Data ── */
  const donutDataRaw = useMemo(() => {
    const counts = {};
    dashboardData.assets.forEach(a => {
      const type = a.assetType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    // sort by count
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3);
    const other = sorted.slice(3).reduce((acc, item) => acc + item[1], 0);
    
    const colors = ['var(--db-blue)', 'var(--db-green)', 'var(--db-rust)', 'var(--db-amber)'];
    let finalData = top3.map(([name, count], i) => ({ name, count, color: colors[i] }));
    if (other > 0 || finalData.length === 0) {
      finalData.push({ name: 'Other', count: other, color: 'var(--db-amber)' });
    }
    const total = dashboardData.assets.length || 1;
    let runningPct = 0;
    finalData.forEach((d, i) => {
      d.pct = Math.round((d.count / total) * 100);
      if (i === finalData.length - 1) d.pct = 100 - runningPct; // ensure it adds to 100%
      runningPct += d.pct;
    });
    return finalData;
  }, [dashboardData.assets]);

  const donutGradient = useMemo(() => {
    if (donutDataRaw.length === 0) return `conic-gradient(var(--db-blue) 0% 100%)`;
    let grad = [];
    let acc = 0;
    donutDataRaw.forEach((d) => {
      const next = acc + d.pct;
      grad.push(`${d.color} ${acc}% ${next}%`);
      acc = next;
    });
    return `conic-gradient(${grad.join(', ')})`;
  }, [donutDataRaw]);

  /* ── Dynamic Bar Chart Data ── */
  const { monthCostData, totalYtdCost, thisMonthCost } = useMemo(() => {
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let ytd = 0;
    let thisMonth = 0;
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      let m = new Date();
      m.setMonth(currentMonthIndex - i);
      last6Months.push({ 
        month: months[m.getMonth()], 
        monthIdx: m.getMonth(), 
        year: m.getFullYear(), 
        total: 0, 
        pct: 0, 
        current: i === 0 
      });
    }

    const trends = financialInsights?.monthlyTrends || [];

    if (trends.length > 0) {
      trends.forEach((t) => {
        const [yStr, mStr] = String(t.month || '').split('-');
        const year = Number(yStr);
        const monthIdx = Number(mStr) - 1;
        const spend = Number(t.spend || 0);

        if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0 || monthIdx > 11) return;

        if (year === currentYear) ytd += spend;
        if (year === currentYear && monthIdx === currentMonthIndex) thisMonth += spend;

        last6Months.forEach((m) => {
          if (m.monthIdx === monthIdx && m.year === year) {
            m.total += spend;
          }
        });
      });
    } else {
      // Fallback: derive from maintenance cost report details
      dashboardData.costReport.forEach(asset => {
        asset.details?.forEach(d => {
          const cost = Number(d.cost || 0);
          const date = new Date(d.repairDate);
          if (Number.isNaN(date.getTime())) return;

          if (date.getFullYear() === currentYear) ytd += cost;
          if (date.getMonth() === currentMonthIndex && date.getFullYear() === currentYear) {
            thisMonth += cost;
          }

          last6Months.forEach(m => {
            if (m.monthIdx === date.getMonth() && m.year === date.getFullYear()) {
              m.total += cost;
            }
          });
        });
      });
    }

    let maxTotal = Math.max(...last6Months.map(m => m.total));
    if (maxTotal === 0) maxTotal = 100; // prevent divide by zero

    last6Months.forEach(m => {
      m.pct = Math.round((m.total / maxTotal) * 100);
      if (m.total > 0) m.pct = Math.max(m.pct, 5); // insure non-zero bars have some height
    });

    return { monthCostData: last6Months, totalYtdCost: ytd, thisMonthCost: thisMonth };
  }, [dashboardData.costReport, financialInsights]);

  /* ── Dynamic Department Data ── */
  const deptDataRaw = useMemo(() => {
    const counts = {};
    dashboardData.assets.forEach(a => {
      const dbDept = a.departmentName || 'Unassigned';
      counts[dbDept] = (counts[dbDept] || 0) + 1;
    });

    const colors = ['var(--db-blue)', 'var(--db-amber)', 'var(--db-green)', 'var(--db-rust)', '#7B5EA7', 'rgba(13,13,13,.18)'];
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, used], i) => ({
        name,
        used,
        total: Math.max(used * 1.5, 10).toFixed(0), // Mocked department total limit
        color: colors[i % colors.length]
      }));
  }, [dashboardData.assets]);

  /* ── Dynamic Warranty Data ── */
  const warrantyDataRaw = useMemo(() => {
    if(dashboardData.assets.length === 0) return [];
    const withLength = dashboardData.assets.slice(0, 4);
    return withLength.map((a, i) => {
       const days = [7, 23, 76, 142][i % 4];
       let cls = 'ok', icon = '✅';
       if (days < 10) { cls = 'crit'; icon = '🚨'; }
       else if (days < 30) { cls = 'warn'; icon = '⚠️'; }
       return { icon, name: a.assetName || `Asset #${a.assetId}`, days, cls };
    });
  }, [dashboardData.assets]);

  /* ── Animate items on mount ── */
  useEffect(() => {
    const timers = [];
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const h = bar.dataset.h;
      bar.style.height = '0%';
      timers.push(setTimeout(() => {
        bar.style.transition = 'height .7s cubic-bezier(.34,1,.64,1)';
        bar.style.height = h + '%';
      }, 200 + i * 60));
    });
    deptRefs.current.forEach((fill, i) => {
      if (!fill) return;
      const w = fill.dataset.w;
      fill.style.width = '0%';
      timers.push(setTimeout(() => {
        fill.style.transition = 'width .8s cubic-bezier(.34,1,.64,1)';
        fill.style.width = w + '%';
      }, 300 + i * 80));
    });
    return () => timers.forEach(clearTimeout);
  }, [monthCostData, deptDataRaw, activeTab]);
  /* ── Dynamic Activity Data ── */


  if (isEmployee) {
    return <EmployeeDashboardPage />;
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="page db-page">

      {/* ── Greeting ─────────────────────────────────────── */}
      {/* ── Tabs header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(13,13,13,0.12)', paddingBottom: '6px' }}>
        <button 
          style={{
            padding: '8px 16px',
            background: activeTab === 'overview' ? 'rgba(42,111,200,0.12)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--db-blue)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--db-text)' : 'rgba(13,13,13,0.62)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '8px'
          }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          style={{
            padding: '8px 16px',
            background: activeTab === 'financial' ? 'rgba(200,75,47,0.12)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'financial' ? '2px solid var(--db-rust)' : '2px solid transparent',
            color: activeTab === 'financial' ? 'var(--db-text)' : 'rgba(13,13,13,0.62)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '8px'
          }}
          onClick={() => setActiveTab('financial')}
        >
          Financial Insights
        </button>
      </div>

      {activeTab === 'financial' ? (
        <FinancialInsights insights={financialInsights} loading={financialLoading} error={financialError} orgId={currentOrgId} />
      ) : (
      <>
      {/* ── KPIs ─────────────────────────────────────────── */}
      <div className="db-kpi-grid">
        {kpis.map((k, i) => (
          <div className={`db-kpi db-kpi-${k.color}`} key={i}>
            <div className="db-kpi-icon">{k.emoji}</div>
            <div className="db-kpi-label">{k.label}</div>
            <div className="db-kpi-value"><AnimVal val={k.val} /></div>
            <div className="db-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Charts ── */}
      <div className="db-row db-row-3-2 db-d5">
        {/* Monthly Maintenance Cost */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Monthly Maintenance Cost</span>
            <button className="db-panel-action" onClick={() => setActiveTab('financial')}>View report →</button>
          </div>
          <div className="db-panel-body">
            <div className="db-cost-header">
              <div>
                <div className="db-cost-label">YTD Total</div>
                <div className="db-cost-big">${totalYtdCost.toFixed(0)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="db-cost-label">This month</div>
                <div className="db-cost-month">${thisMonthCost.toFixed(0)}</div>
              </div>
            </div>
            <div className="db-bar-chart">
              {monthCostData.map((m, i) => (
                <div className="db-bar-col" key={i}>
                  <div className="db-bar-wrap">
                    <div
                      className={`db-bar-fill ${m.current ? 'current' : 'dim'}`}
                      ref={el => { if (barRefs.current) barRefs.current[i] = el; }}
                      data-h={m.pct}
                    />
                  </div>
                  <div className={`db-bar-month ${m.current ? 'active' : ''}`}>{m.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset Breakdown Donut */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Asset Breakdown</span>
            <button className="db-panel-action" onClick={() => navigate('/maintenance-logs')}>All assets →</button>
          </div>
          <div className="db-panel-body">
            <div className="db-donut-wrap">
              <div className="db-donut" style={{ background: donutGradient }}>
                <div className="db-donut-centre">
                  <div className="db-donut-num">{dashboardData.assets.length}</div>
                  <div className="db-donut-lbl">Total</div>
                </div>
              </div>
              <div className="db-donut-legend">
                {donutDataRaw.map((d, i) => (
                  <div className="db-legend-item" key={i}>
                    <div className="db-legend-dot" style={{ background: d.color }} />
                    <div className="db-legend-name">{d.name}</div>
                    <div className="db-legend-pct">{d.pct}%</div>
                    <div className="db-legend-count">{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Tickets + Recent Assets ───────────────── */}
      <div className="db-row db-row-3-2 db-d6">
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Recent Tickets</span>
            <button className="db-panel-action" onClick={() => navigate('/tickets')}>All tickets →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <TicketTable tickets={dashboardData.tickets.filter(t => t.status < 3).slice(0, 5)} />
          </div>
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Recent Assets</span>
            <button className="db-panel-action" onClick={() => navigate('/assets')}>All assets →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 8 }}>
            <AssetList assets={dashboardData.assets} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Team + Departments + Activity/Warranty ── */}
      <div className="db-row db-row-3 db-d7">
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Team Structure</span>
            <button className="db-panel-action" onClick={() => navigate('/users')}>Manage users →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 12 }}>
            <div className="db-team-grid">
              {dashboardData.users.slice(0, 6).map((m, i) => {
                 const initials = (m.fullName || m.email || 'U').substring(0,2).toUpperCase();
                 return (
                <div className="db-member" key={i}>
                  <div className="db-m-avatar" style={{ background: '#2A6FC8' }}>{initials}</div>
                  <div>
                    <div className="db-m-name">{m.fullName || m.email}</div>
                    <div className="db-m-role">{m.role}</div>
                  </div>
                  <div className={`db-m-status ${m.isActive ? 'on' : 'off'}`} />
                </div>
              )})}
            </div>
            {/* Adding back plan usage logic referencing Dashboard Data limit */}
            <div className="db-plan-usage">
              <div className="db-plan-label">Plan usage</div>
              <div className="db-plan-track">
                <div className="db-plan-fill" style={{ width: `${Math.min(100, Math.round((dashboardData.users.length / 25) * 100))}%` }} />
              </div>
              <div className="db-plan-nums">
                <span>{dashboardData.users.length} of 25 seats used</span>
                <span style={{ color: 'var(--db-text)' }}>{Math.min(100, Math.round((dashboardData.users.length / 25) * 100))}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Usage restored */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">Assets by Department</span>
            <button className="db-panel-action" onClick={() => navigate('/departments')}>Departments →</button>
          </div>
          <div className="db-panel-body" style={{ paddingTop: 14 }}>
            <div className="db-dept-bars">
              {deptDataRaw.map((d, i) => (
                <div className="db-dept-row" key={i}>
                  <div className="db-dept-meta">
                    <span className="db-dept-name">{d.name}</span>
                    <span className="db-dept-nums">{d.used} / {d.total ?? '—'}</span>
                  </div>
                  <div className="db-dept-track">
                    <div
                      className="db-dept-fill"
                      ref={el => { if (deptRefs.current) deptRefs.current[i] = el; }}
                      data-w={d.total ? Math.round((d.used / d.total) * 100) : 20}
                      style={{ background: d.color }}
                    />
                  </div>
                </div>
              ))}
              {deptDataRaw.length === 0 && <div style={{textAlign: 'center', opacity: 0.5}}>No assets deployed yet</div>}
            </div>
          </div>
        </div>

        <div className="db-stacked-col">
          {/* Warranty Alerts */}
          <div className="db-panel">
            <div className="db-panel-head">
              <span className="db-panel-title">Warranty Expiry</span>
              <button className="db-panel-action" onClick={() => navigate('/report-warranty')}>Full report →</button>
            </div>
            <div className="db-panel-body" style={{ paddingTop: 8 }}>
              <div className="db-warranty-list">
                {warrantyDataRaw.map((w, i) => (
                  <div className="db-w-item" key={i}>
                    <div className="db-w-icon">{w.icon}</div>
                    <div className="db-w-name">{w.name}</div>
                    <span className={`db-w-days db-w-${w.cls}`}>{w.days} days</span>
                  </div>
                ))}
                {warrantyDataRaw.length === 0 && <div style={{textAlign: 'center', opacity: 0.5}}>No assets nearing expiry</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        orgId={currentOrgId}
        onUserInvited={() => {
          api.get('/User', { params: { orgId: currentOrgId } }).then(res => {
            setDashboardData(prev => ({ ...prev, users: res.data || [] }));
          }).catch(() => { });
        }}
      />
    </div>
  );
}
