using System;
using System.Threading;
using System.Threading.Tasks;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class AssignMaintenanceTicketCommandHandler : IRequestHandler<AssignMaintenanceTicketCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AssignMaintenanceTicketCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AssignMaintenanceTicketCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.MaintenanceTickets
            .FirstOrDefaultAsync(t => t.TicketId == request.TicketId, cancellationToken);
            
        if (ticket == null)
            throw new KeyNotFoundException($"Maintenance ticket {request.TicketId} not found.");

        var technician = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.TechnicianId, cancellationToken);
            
        if (technician == null)
            throw new KeyNotFoundException($"Technician {request.TechnicianId} not found.");

        if (technician.Role != UserRole.technician)
            throw new InvalidOperationException($"User {request.TechnicianId} is not a technician.");

        ticket.AssignedTo = request.TechnicianId;
        // Automatically move status from open to assigned if it was open
        if (ticket.Status == TicketStatus.open)
        {
            ticket.Status = TicketStatus.assigned;
        }
        
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
