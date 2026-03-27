import React, { useState } from 'react';
import TicketFilterBar from '../../components/MaintenanceTickets/TicketFilterBar';
import TicketList from '../../components/MaintenanceTickets/TicketList';
import './AllTicketsPage.css';

const AllTicketsPage = () => {
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (newFilterChanges) => {
    setFilters(prev => ({
      ...prev,
      ...newFilterChanges
    }));
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      status: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  return (
    <div className="all-tickets-page">
      <div className="page-header">
        <h1>Maintenance Tickets</h1>
        <p>Find and manage all maintenance requests.</p>
      </div>
      
      <TicketFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClearFilters={clearFilters}
      />
      
      <TicketList filters={filters} />
    </div>
  );
};

export default AllTicketsPage;
