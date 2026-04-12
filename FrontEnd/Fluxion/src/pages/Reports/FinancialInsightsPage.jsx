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
                <thead><tr><th>Department</th><th>Total Spend</th></tr></thead>
                <tbody>
                  {data.spendByDepartment?.map((d, i) => (
                    <tr key={i}><td>{d.departmentName}</td><td className="fi-num">{formatCurrency(d.totalSpend)}</td></tr>
                  ))}
                  {(!data.spendByDepartment || data.spendByDepartment.length === 0) && <tr><td colSpan="2">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Cost Per Technician */}
            <div className="fi-card">
              <h2>Cost per Technician</h2>
              <table className="fi-table">
                <thead><tr><th>Technician</th><th>Total Cost</th></tr></thead>
                <tbody>
                  {data.costPerTechnician?.map((t, i) => (
                    <tr key={i}><td>{t.technicianName}</td><td className="fi-num">{formatCurrency(t.totalCost)}</td></tr>
                  ))}
                  {(!data.costPerTechnician || data.costPerTechnician.length === 0) && <tr><td colSpan="2">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Cost Per Asset (Top 10) */}
            <div className="fi-card">
              <h2>Cost per Asset (Top 10)</h2>
              <table className="fi-table">
                <thead><tr><th>Asset Name</th><th>Total Cost</th></tr></thead>
                <tbody>
                  {data.costPerAsset?.map((a, i) => (
                    <tr key={i}><td>{a.assetName}</td><td className="fi-num">{formatCurrency(a.totalCost)}</td></tr>
                  ))}
                  {(!data.costPerAsset || data.costPerAsset.length === 0) && <tr><td colSpan="2">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Monthly Trends */}
            <div className="fi-card">
              <h2>Monthly Spend Trends</h2>
              <table className="fi-table">
                <thead><tr><th>Month</th><th>Spend</th></tr></thead>
                <tbody>
                  {data.monthlyTrends?.map((m, i) => (
                    <tr key={i}><td>{m.month}</td><td className="fi-num">{formatCurrency(m.spend)}</td></tr>
                  ))}
                  {(!data.monthlyTrends || data.monthlyTrends.length === 0) && <tr><td colSpan="2">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
