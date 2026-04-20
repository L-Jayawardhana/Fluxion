using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class CreateMaintenanceTicketCommandHandler : IRequestHandler<CreateMaintenanceTicketCommand, CreateMaintenanceTicketResult>
{
    private readonly IApplicationDbContext _context;

    public CreateMaintenanceTicketCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateMaintenanceTicketResult> Handle(CreateMaintenanceTicketCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Asset
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId, cancellationToken);
            
        if (asset == null)
            throw new KeyNotFoundException($"Asset ID {request.AssetId} not found in this organization.");

        // 2. Validate state
        if (asset.Status == AssetStatus.retired)
            throw new InvalidOperationException("Cannot raise a ticket against a retired asset.");

        if (asset.Status == AssetStatus.under_maintenance)
            throw new InvalidOperationException("Asset is already under maintenance.");

        // Find assignment if any (so we know if it was actively assigned)
        var assignment = await _context.AssetAssignments
            .Where(aa => aa.AssetId == request.AssetId && aa.ReturnDate == null)
            .FirstOrDefaultAsync(cancellationToken);

        // 3. Create Ticket
        var ticket = new MaintenanceTicket
        {
            AssetId = request.AssetId,
            OrgId = request.OrgId,
            RaisedBy = request.RaisedBy,
            Title = request.Title,
            IssueDescription = request.Description,
            Priority = request.Priority,
            Status = TicketStatus.open,
            AssignmentId = assignment?.AssignmentId
        };

        _context.MaintenanceTickets.Add(ticket);

        // 4. Update Asset Status atomically
        asset.Status = AssetStatus.under_maintenance;

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateMaintenanceTicketResult(ticket.TicketId);
    }
}
