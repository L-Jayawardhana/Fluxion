using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.MaintenanceLogs;

public record AddMaintenanceCommentCommand(int TicketId, string Content, bool? IsVisibleToEmployee)
    : IRequest<Result<MaintenanceCommentDto>>;
