using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Persistence.Context;
using System.Linq;

namespace Fluxion.Persistence.Repositories;

public class MaintenanceTicketRepository : IMaintenanceTicketRepository
{
    private readonly FluxionDbContext _context;

    public MaintenanceTicketRepository(FluxionDbContext context)
    {
        _context = context;
    }

    public IQueryable<MaintenanceTicket> GetTicketsQuery()
    {
        return _context.MaintenanceTickets.AsQueryable();
    }
}
