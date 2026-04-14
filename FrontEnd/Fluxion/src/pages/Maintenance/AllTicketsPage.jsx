import React, { useState } from 'react';
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
    if ((user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager') && user?.orgId) {
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
    <div className="all-tickets-page page aa-page">
      <div className="aa-header page-header">
        <div className="aa-header-text">
          <h1 className="aa-title">Maintenance Tickets</h1>
          <p className="aa-subtitle">Find and manage all maintenance requests.</p>
        </div>
      </div>
      
      <TicketFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onClearFilters={clearFilters}
        technicians={technicians}
        showTechnicianFilter={user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager'}
      />
      
      <TicketList filters={filters} />
    </div>
  );
};

export default AllTicketsPage;
