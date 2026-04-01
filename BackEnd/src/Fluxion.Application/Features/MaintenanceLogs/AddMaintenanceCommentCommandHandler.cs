using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class AddMaintenanceCommentCommandHandler : IRequestHandler<AddMaintenanceCommentCommand, Result<MaintenanceCommentDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AddMaintenanceCommentCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<MaintenanceCommentDto>> Handle(AddMaintenanceCommentCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access");

        if (role != "technician")
            throw new ForbiddenException("Access denied");

        var ticket = await _db.MaintenanceTickets
            .FirstOrDefaultAsync(t => t.TicketId == request.TicketId, cancellationToken);

        if (ticket is null)
            throw new KeyNotFoundException("Ticket not found");

        if (ticket.AssignedTo != userId.Value)
            throw new ForbiddenException("Access denied");

        var comment = new MaintenanceLog
        {
            OrgId = ticket.OrgId,
            TicketId = ticket.TicketId,
            AssetId = ticket.AssetId,
            TechnicianId = userId.Value,
            RepairDate = DateTime.UtcNow,
            RepairCost = null,
            RepairNotes = request.Content,
            IsVisibleToEmployee = request.IsVisibleToEmployee ?? true
        };

        _db.MaintenanceLogs.Add(comment);
        await _db.SaveChangesAsync(cancellationToken);

        var author = await _db.Users
            .Where(u => u.UserId == userId.Value)
            .Select(u => new { u.FullName, u.Role })
            .FirstOrDefaultAsync(cancellationToken);

        var dto = new MaintenanceCommentDto
        {
            LogId = comment.LogId,
            TicketId = ticket.TicketId,
            TicketTitle = ticket.Title,
            AuthorName = author?.FullName ?? "Technician",
            AuthorRole = author?.Role.ToString() ?? "technician",
            Content = comment.RepairNotes ?? string.Empty,
            CreatedAt = comment.RepairDate,
            IsVisibleToEmployee = comment.IsVisibleToEmployee
        };

        return Result<MaintenanceCommentDto>.Success(dto);
    }
}
