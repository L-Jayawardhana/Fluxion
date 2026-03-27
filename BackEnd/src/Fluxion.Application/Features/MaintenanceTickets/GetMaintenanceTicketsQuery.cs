using System;
using Fluxion.Application.DTOs.Common;
using Fluxion.Domain.Enums;
using MediatR;

namespace Fluxion.Application.Features.MaintenanceTickets;

public record GetMaintenanceTicketsQuery : IRequest<Result<PagedResult<MaintenanceTicketSummaryDto>>>
{
    public TicketStatus? Status { get; init; }
    public TicketPriority? Priority { get; init; }
    public int? AssetId { get; init; }
    public int? DepartmentId { get; init; }
    public int? TechnicianId { get; init; }
    public DateTime? DateFrom { get; init; }
    public DateTime? DateTo { get; init; }
    public string? Keyword { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
