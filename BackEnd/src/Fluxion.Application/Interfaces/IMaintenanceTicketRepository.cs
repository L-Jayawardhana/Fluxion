using System.Linq;
using Fluxion.Domain.Entities;

namespace Fluxion.Application.Interfaces;

public interface IMaintenanceTicketRepository
{
    IQueryable<MaintenanceTicket> GetTicketsQuery();
}
