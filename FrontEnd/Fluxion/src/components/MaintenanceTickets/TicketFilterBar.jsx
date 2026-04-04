import React, { useState, useEffect } from 'react';
import './TicketFilterBar.css';

const TicketFilterBar = ({ filters, onFilterChange, onClearFilters, technicians = [], showTechnicianFilter = false }) => {
  const [keyword, setKeyword] = useState(filters.keyword || '');

  // Debounce for keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ keyword });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Sync internal keyword state if filters are cleared from outside
  useEffect(() => {
    if (filters.keyword === '') {
      setKeyword('');
    }
  }, [filters.keyword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  return (
    <div className="ticket-filter-bar">
      <div className="filter-group">
        <label>Keyword</label>
        <input 
          type="text" 
          placeholder="Search items..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Status</label>
        <select name="status" value={filters.status || ''} onChange={handleChange}>
          <option value="">All</option>
          <option value="0">Open</option>
          <option value="1">Assigned</option>
          <option value="2">In Progress</option>
          <option value="3">Waiting Parts</option>
          <option value="4">Resolved</option>
          <option value="5">Closed</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Priority</label>
        <select name="priority" value={filters.priority || ''} onChange={handleChange}>
          <option value="">All</option>
          <option value="0">Low</option>
          <option value="1">Medium</option>
          <option value="2">High</option>
          <option value="3">Critical</option>
        </select>
      </div>

      {showTechnicianFilter && (
        <div className="filter-group">
          <label>Technician</label>
          <select name="technicianId" value={filters.technicianId || ''} onChange={handleChange}>
            <option value="">All</option>
            {technicians.map(t => (
              <option key={t.userId} value={t.userId}>{t.fullName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label>From Date</label>
        <input 
          type="date" 
          name="dateFrom" 
          value={filters.dateFrom || ''}
          onChange={handleChange}
        />
      </div>

      <div className="filter-group">
        <label>To Date</label>
        <input 
          type="date" 
          name="dateTo" 
          value={filters.dateTo || ''}
          onChange={handleChange}
        />
      </div>

      <div className="filter-actions">
        <button className="btn-clear" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default TicketFilterBar;
