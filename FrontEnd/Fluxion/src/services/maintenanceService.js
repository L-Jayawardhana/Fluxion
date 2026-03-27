import api from './api';

export const createMaintenanceTicket = async (ticketData) => {
  const response = await api.post('/maintenance-tickets', ticketData);
  return response.data;
};
