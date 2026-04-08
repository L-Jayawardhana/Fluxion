using System;
using System.Threading;
using System.Threading.Tasks;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class AssignMaintenanceTicketCommandHandler : IRequestHandler<AssignMaintenanceTicketCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketAlertEmailService _alertEmailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AssignMaintenanceTicketCommandHandler> _logger;

    public AssignMaintenanceTicketCommandHandler(
        IApplicationDbContext context,
        ITicketAlertEmailService alertEmailService,
        INotificationService notificationService,
        ILogger<AssignMaintenanceTicketCommandHandler> logger)
    {
        _context = context;
        _alertEmailService = alertEmailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<bool> Handle(AssignMaintenanceTicketCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.MaintenanceTickets
            .Include(t => t.Asset)
            .FirstOrDefaultAsync(t => t.TicketId == request.TicketId, cancellationToken);
            
        if (ticket == null)
            throw new KeyNotFoundException($"Maintenance ticket {request.TicketId} not found.");

        var technician = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.TechnicianId, cancellationToken);
            
        if (technician == null)
            throw new KeyNotFoundException($"Technician {request.TechnicianId} not found.");

        if (technician.Role != UserRole.technician)
            throw new InvalidOperationException($"User {request.TechnicianId} is not a technician.");

        var oldStatus = ticket.Status;
        ticket.AssignedTo = request.TechnicianId;
        // Automatically move status from open to assigned if it was open
        if (ticket.Status == TicketStatus.open)
        {
            ticket.Status = TicketStatus.assigned;
        }
        
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // ── Send email notification to the ticket reporter about the assignment ──
        try
        {
            var reporter = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == ticket.RaisedBy, cancellationToken);

            if (reporter != null)
            {
                await _alertEmailService.SendTicketStatusUpdatedEmailAsync(
                    toEmail:        reporter.Email,
                    recipientName:  reporter.FullName,
                    ticketId:       ticket.TicketId,
                    ticketTitle:    ticket.Title,
                    oldStatus:      oldStatus.ToString(),
                    newStatus:      ticket.Status.ToString(),
                    technicianName: technician.FullName,
                    assetName:      ticket.Asset?.AssetName ?? "Unknown Asset"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ticket assignment email for ticket {TicketId}", request.TicketId);
        }

        // ── Persist in-app notification ──
        {
            var reporterUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == ticket.RaisedBy, cancellationToken);
            if (reporterUser != null)
            {
                await _notificationService.CreateNotificationAsync(
                    orgId:    ticket.OrgId,
                    userId:   reporterUser.UserId,
                    type:     "ticket_status_updated",
                    title:    "Ticket Assigned",
                    message:  $"Your ticket \"{ticket.Title}\" has been assigned to technician {technician.FullName}.",
                    ticketId: ticket.TicketId,
                    assetId:  ticket.AssetId,
                    ct:       cancellationToken
                );
            }
        }

        return true;
    }
}
