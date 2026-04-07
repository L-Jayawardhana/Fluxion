import React, { useMemo } from 'react';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

export default function SummaryStatsBar({ summaryStats, loading }) {
  const mostActiveTech = useMemo(() => {
    if (!summaryStats?.costPerTechnician || summaryStats.costPerTechnician.length === 0) return 'No activity';
    const sorted = [...summaryStats.costPerTechnician].sort((a, b) => {
      if (b.eventsCount !== a.eventsCount) return b.eventsCount - a.eventsCount;
      return b.totalCost - a.totalCost;
    });
    return sorted[0]?.technicianName || 'No activity';
  }, [summaryStats]);

  if (loading) {
    return (
      <div className="ml-summary">
        <div className="ml-summary-cards">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ml-summary-card">
              <div className="ml-skeleton" style={{ height: 12, width: '50%' }} />
              <div className="ml-skeleton" style={{ height: 24, width: '70%' }} />
            </div>
          ))}
        </div>
        <div className="ml-summary-table">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ml-skeleton" style={{ height: 18, width: '100%' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!summaryStats) return null;

  return (
    <div className="ml-summary">
      <div className="ml-summary-cards">
        <div className="ml-summary-card">
          <div className="ml-summary-label">Total Maintenance Events</div>
          <div className="ml-summary-value">{summaryStats.totalMaintenanceCount}</div>
        </div>
        <div className="ml-summary-card">
          <div className="ml-summary-label">Total Cost</div>
          <div className="ml-summary-value">{formatCurrency(summaryStats.totalCost)}</div>
        </div>
        <div className="ml-summary-card">
          <div className="ml-summary-label">Average Resolution Time</div>
          <div className="ml-summary-value">{summaryStats.averageResolutionTimeHours}h</div>
        </div>
        <div className="ml-summary-card">
          <div className="ml-summary-label">Most Active Technician</div>
          <div className="ml-summary-value">{mostActiveTech}</div>
        </div>
      </div>

      <div className="ml-summary-table">
        <div className="ml-summary-table-head">
          <span>Technician Name</span>
          <span>Total Cost</span>
          <span>Events Count</span>
        </div>
        {summaryStats.costPerTechnician.length === 0 ? (
          <div className="ml-summary-empty">No technician activity recorded.</div>
        ) : (
          summaryStats.costPerTechnician.map((t, i) => (
            <div key={`${t.technicianName}-${i}`} className="ml-summary-row">
              <span>{t.technicianName}</span>
              <span>{formatCurrency(t.totalCost)}</span>
              <span>{t.eventsCount}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
