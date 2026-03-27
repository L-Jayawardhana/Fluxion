using Fluxion.Domain.Enums;
using MediatR;

namespace Fluxion.Application.Features.MaintenanceTickets;

public record CreateMaintenanceTicketCommand(
    int AssetId,
    int OrgId,
    int RaisedBy,
    string Title,
    string Description,
    TicketPriority Priority
) : IRequest<CreateMaintenanceTicketResult>;

public record CreateMaintenanceTicketResult(int TicketId);
