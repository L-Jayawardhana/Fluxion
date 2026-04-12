import React, { useMemo, useState } from 'react';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};

const truncate = (text, length = 140) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
};

export default function MaintenanceLogTable({ maintenanceLogs, role, loading, onPageChange }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const isOwner = role === 'owner' || role === 'admin' || role === 'systemadmin' || role === 'manager';
  const isTechnician = role === 'technician';
  const isEmployee = role === 'user' || role === 'employee';

  const variant = useMemo(() => {
    if (isOwner) return 'owner';
    if (isTechnician) return 'technician';
    return 'employee';
  }, [isOwner, isTechnician]);

  const toggleExpanded = (logId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId); else next.add(logId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="ml-log-table">
        <div className="ml-log-header ml-columns-owner">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="ml-skeleton" style={{ height: 14, width: '70%' }} />
          ))}
        </div>
        {[...Array(5)].map((_, row) => (
          <div key={row} className="ml-log-row ml-columns-owner">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="ml-skeleton" style={{ height: 18, width: '90%' }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!maintenanceLogs || maintenanceLogs.items.length === 0) {
    return (
      <div className="ml-empty">No maintenance records found.</div>
    );
  }

  return (
    <div className="ml-log-table">
      <div className={`ml-log-header ml-columns-${variant}`}>
        <span>Ticket Title</span>
        {isOwner && <span>Technician Name</span>}
        {isEmployee && <span>Technician Name</span>}
        <span>Repair Description</span>
        {(isOwner || isTechnician) && <span>Cost</span>}
        <span>Condition After</span>
        <span>Logged At</span>
        <span>Resolved At</span>
      </div>

      {maintenanceLogs.items.map((log) => {
        const isExpanded = expanded.has(log.logId);
        const description = isExpanded ? log.repairDescription : truncate(log.repairDescription);
        return (
          <div key={log.logId} className={`ml-log-row ml-columns-${variant}`}>
            <div className="ml-log-title">
              <div className="ml-ticket-title">{log.ticketTitle}</div>
              <div className="ml-ticket-id">#{log.ticketId}</div>
            </div>
            {isOwner && <div>{log.technicianName}</div>}
            {isEmployee && <div>{log.technicianName}</div>}
            <div className="ml-log-description">
              <span>{description || 'No description'}</span>
              {log.repairDescription && log.repairDescription.length > 140 && (
                <button type="button" className="ml-link" onClick={() => toggleExpanded(log.logId)}>
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            {(isOwner || isTechnician) && (
              <div className="ml-log-cost">
                <div>L: {formatCurrency(log.laborCost ?? 0)}</div>
                <div>P: {formatCurrency(log.partsCost ?? 0)}</div>
                <div><strong>T: {formatCurrency(log.cost)}</strong></div>
              </div>
            )}
            <div>{log.conditionAfterRepair || 'N/A'}</div>
            <div>{formatDate(log.loggedAt)}</div>
            <div>{formatDate(log.resolvedAt)}</div>
          </div>
        );
      })}

      <div className="ml-pagination">
        <button
          className="ml-btn"
          onClick={() => onPageChange(maintenanceLogs.pageNumber - 1)}
          disabled={!maintenanceLogs.hasPreviousPage}
        >
          Prev
        </button>
        <span>Page {maintenanceLogs.pageNumber} of {Math.max(1, maintenanceLogs.totalPages)}</span>
        <button
          className="ml-btn"
          onClick={() => onPageChange(maintenanceLogs.pageNumber + 1)}
          disabled={!maintenanceLogs.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}
