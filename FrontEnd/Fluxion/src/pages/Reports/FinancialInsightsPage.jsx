import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getFinancialInsightsReport } from '../../services/maintenanceLogService';
import * as XLSX from 'xlsx';
import './FinancialInsightsPage.css';

export default function FinancialInsightsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFinancialInsightsReport({
        orgId: user?.orgId || undefined,
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
  }, [startDate, endDate, user?.orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;
    
    // Create new workbook
    const wb = XLSX.utils.book_new();

    // Stats
    const statsData = [
      ['Metric', 'Value'],
      ['Total Budget', data.budgetComparison?.totalBudget || 0],
      ['Actual Spend', data.budgetComparison?.actualSpend || 0],
      ['Variance', data.budgetComparison?.variance || 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statsData), 'Budget vs Actual');

    // Spend By Dept
    if (data.spendByDepartment) {
      const deptWs = XLSX.utils.json_to_sheet(data.spendByDepartment);
      XLSX.utils.book_append_sheet(wb, deptWs, 'Spend by Department');
    }

    // Cost Per Tech
    if (data.costPerTechnician) {
      const techWs = XLSX.utils.json_to_sheet(data.costPerTechnician);
      XLSX.utils.book_append_sheet(wb, techWs, 'Cost per Technician');
    }

    // Cost Per Asset
    if (data.costPerAsset) {
      const assetWs = XLSX.utils.json_to_sheet(data.costPerAsset);
      XLSX.utils.book_append_sheet(wb, assetWs, 'Cost per Asset');
    }

    // Monthly Trends
    if (data.monthlyTrends) {
      const trendWs = XLSX.utils.json_to_sheet(data.monthlyTrends);
      XLSX.utils.book_append_sheet(wb, trendWs, 'Monthly Trends');
    }

    // Save
    XLSX.writeFile(wb, 'Financial_Insights.xlsx');
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

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
    return {
      ...t,
      laborCost: Number(t?.laborCost ?? fallbackLabour),
      partsCost: Number(t?.partsCost ?? 0),
      totalCost: total,
    };
  });

  const costPerAsset = (data?.costPerAsset || []).map((a) => {
    const labor = Number(a?.laborCost ?? 0);
    const parts = Number(a?.partsCost ?? 0);
    const maintenance = Number(a?.maintenanceCost ?? (labor + parts));
    const total = Number(a?.totalCost ?? 0);
    const initial = Number(a?.purchaseCost ?? Math.max(total - maintenance, 0));
    return {
      ...a,
      laborCost: labor,
      partsCost: parts,
      maintenanceCost: maintenance,
      purchaseCost: initial,
      totalCost: total,
    };
  });

  const monthlyTrends = (data?.monthlyTrends || []).map((m) => {
    const total = Number(m?.spend ?? 0);
    const fallbackLabour = m?.laborSpend == null && m?.partsSpend == null ? total : 0;
    return {
      ...m,
      laborSpend: Number(m?.laborSpend ?? fallbackLabour),
      partsSpend: Number(m?.partsSpend ?? 0),
      spend: total,
    };
  });

  return (
    <div className="page fi-page">
      <div className="fi-header">
        <div>
          <div className="fi-eyebrow">Reports · Admin</div>
          <h1 className="fi-title">Financial Insights</h1>
        </div>
        <div className="fi-actions">
          <div className="fi-filters">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="fi-input" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="fi-input" />
            <button className="fi-btn fi-btn-primary" onClick={loadData}>Apply</button>
          </div>
          <button className="fi-btn fi-btn-secondary" onClick={handleExportPDF}>Export PDF</button>
          <button className="fi-btn fi-btn-secondary" onClick={handleExportExcel}>Export Excel</button>
        </div>
      </div>

      {error && <div className="fi-alert">{error}</div>}

      {loading && !data && <div className="fi-loading">Loading insights...</div>}

      {!loading && data && (
        <div className="fi-dashboard">
          {/* Budget vs Actual */}
          <div className="fi-card fi-budget-card">
            <h2>Budget vs Actual</h2>
            <div className="fi-budget-stats">
              <div>
                <div className="fi-stat-label">Total Budget</div>
                <div className="fi-stat-value">{formatCurrency(data.budgetComparison?.totalBudget)}</div>
              </div>
              <div>
                <div className="fi-stat-label">Actual Spend</div>
                <div className="fi-stat-value">{formatCurrency(data.budgetComparison?.actualSpend)}</div>
              </div>
              <div>
                <div className="fi-stat-label">Variance</div>
                <div className={`fi-stat-value ${data.budgetComparison?.variance < 0 ? 'fi-negative' : 'fi-positive'}`}>
                  {formatCurrency(data.budgetComparison?.variance)}
                </div>
              </div>
            </div>
          </div>

          <div className="fi-grid">
            {/* Spend By Department */}
            <div className="fi-card">
              <h2>Spend by Department</h2>
              <table className="fi-table">
                <thead><tr><th>Department</th><th>Labour</th><th>Parts</th><th>Total Maintenance</th><th>Total Spend</th></tr></thead>
                <tbody>
                  {spendByDepartment.map((d, i) => (
                    <tr key={i}>
                      <td>{d.departmentName}</td>
                      <td className="fi-num">{formatCurrency(d.laborSpend)}</td>
                      <td className="fi-num">{formatCurrency(d.partsSpend)}</td>
                      <td className="fi-num">{formatCurrency(d.maintenanceSpend)}</td>
                      <td className="fi-num">{formatCurrency(d.totalSpend)}</td>
                    </tr>
                  ))}
                  {spendByDepartment.length === 0 && <tr><td colSpan="5">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Cost Per Technician */}
            <div className="fi-card">
              <h2>Cost per Technician</h2>
              <table className="fi-table">
                <thead><tr><th>Technician</th><th>Labour</th><th>Parts</th><th>Total</th></tr></thead>
                <tbody>
                  {costPerTechnician.map((t, i) => (
                    <tr key={i}>
                      <td>{t.technicianName}</td>
                      <td className="fi-num">{formatCurrency(t.laborCost)}</td>
                      <td className="fi-num">{formatCurrency(t.partsCost)}</td>
                      <td className="fi-num">{formatCurrency(t.totalCost)}</td>
                    </tr>
                  ))}
                  {costPerTechnician.length === 0 && <tr><td colSpan="4">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Cost Per Asset (Top 10) */}
            <div className="fi-card">
              <h2>Cost per Asset (Top 10)</h2>
              <table className="fi-table">
                <thead><tr><th>Asset Name</th><th>Initial Cost</th><th>Labour</th><th>Parts</th><th>Total Maintenance</th><th>Total Cost</th></tr></thead>
                <tbody>
                  {costPerAsset.map((a, i) => (
                    <tr key={i}>
                      <td>{a.assetName}</td>
                      <td className="fi-num">{formatCurrency(a.purchaseCost)}</td>
                      <td className="fi-num">{formatCurrency(a.laborCost)}</td>
                      <td className="fi-num">{formatCurrency(a.partsCost)}</td>
                      <td className="fi-num">{formatCurrency(a.maintenanceCost)}</td>
                      <td className="fi-num">{formatCurrency(a.totalCost)}</td>
                    </tr>
                  ))}
                  {costPerAsset.length === 0 && <tr><td colSpan="6">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Monthly Trends */}
            <div className="fi-card">
              <h2>Monthly Spend Trends</h2>
              <table className="fi-table">
                <thead><tr><th>Month</th><th>Labour</th><th>Parts</th><th>Total</th></tr></thead>
                <tbody>
                  {monthlyTrends.map((m, i) => (
                    <tr key={i}>
                      <td>{m.month}</td>
                      <td className="fi-num">{formatCurrency(m.laborSpend)}</td>
                      <td className="fi-num">{formatCurrency(m.partsSpend)}</td>
                      <td className="fi-num">{formatCurrency(m.spend)}</td>
                    </tr>
                  ))}
                  {monthlyTrends.length === 0 && <tr><td colSpan="4">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
