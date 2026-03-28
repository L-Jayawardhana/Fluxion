import React, { useState, useEffect } from 'react';
import TicketFilterBar from '../../components/MaintenanceTickets/TicketFilterBar';
import TicketList from '../../components/MaintenanceTickets/TicketList';
import { getTechnicians } from '../../services/maintenanceService';
import { useAuth } from '../../hooks/useAuth';
import './AllTicketsPage.css';

const AllTicketsPage = () => {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    priority: '',
    technicianId: '',
    dateFrom: '',
    dateTo: ''
  });

  React.useEffect(() => {
    if ((user?.role === 'owner' || user?.role === 'admin') && user?.orgId) {
      getTechnicians(user.orgId).then(setTechnicians).catch(console.error);
    }
  }, [user]);

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
      technicianId: '',
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
        technicians={technicians}
        showTechnicianFilter={user?.role === 'owner' || user?.role === 'admin'}
      />
      
      <TicketList filters={filters} />
    </div>
  );
};

export default AllTicketsPage;
