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

        var reporter = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == ticket.RaisedBy, cancellationToken);

        var oldStatus = ticket.Status;
        ticket.AssignedTo = request.TechnicianId;
        // Automatically move status from open to assigned if it was open
        if (ticket.Status == TicketStatus.open)
        {
            ticket.Status = TicketStatus.assigned;
        }
        
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // ── Persist in-app notification ──
        {
            if (reporter != null)
            {
                await _notificationService.CreateNotificationAsync(
                    orgId:    ticket.OrgId,
                    userId:   reporter.UserId,
                    type:     "ticket_status_updated",
                    title:    "Ticket Assigned",
                    message:  $"Your ticket \"{ticket.Title}\" has been assigned to technician {technician.FullName}.",
                    ticketId: ticket.TicketId,
                    assetId:  ticket.AssetId,
                    ct:       cancellationToken
                );
            }

            if (technician != null)
            {
                await _notificationService.CreateNotificationAsync(
                    orgId:    ticket.OrgId,
                    userId:   technician.UserId,
                    type:     "ticket_assigned",
                    title:    "New Ticket Assigned",
                    message:  $"You have been assigned to ticket \"{ticket.Title}\".",
                    ticketId: ticket.TicketId,
                    assetId:  ticket.AssetId,
                    ct:       cancellationToken
                );
            }
        }

        // ── Send email notification in background to avoid slowing API response ──
        if (reporter != null)
        {
            var reporterEmail = reporter.Email;
            var reporterName = reporter.FullName;
            var ticketId = ticket.TicketId;
            var ticketTitle = ticket.Title;
            var oldStatusText = oldStatus.ToString();
            var newStatusText = ticket.Status.ToString();
            var technicianName = technician?.FullName ?? "Unknown Technician";
            var assetName = ticket.Asset?.AssetName ?? "Unknown Asset";

            _ = Task.Run(async () =>
            {
                try
                {
                    await _alertEmailService.SendTicketStatusUpdatedEmailAsync(
                        toEmail: reporterEmail,
                        recipientName: reporterName,
                        ticketId: ticketId,
                        ticketTitle: ticketTitle,
                        oldStatus: oldStatusText,
                        newStatus: newStatusText,
                        technicianName: technicianName,
                        assetName: assetName
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send ticket assignment email for ticket {TicketId}", ticketId);
                }
            });
        }

        return true;
    }
}
