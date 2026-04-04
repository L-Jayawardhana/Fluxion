using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.MaintenanceLogs;

public record GetMaintenanceCostReportQuery : IRequest<Result<MaintenanceCostReportDto>>
{
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
