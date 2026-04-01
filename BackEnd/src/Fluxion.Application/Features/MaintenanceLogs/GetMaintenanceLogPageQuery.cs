using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.MaintenanceLogs;

public record GetMaintenanceLogPageQuery : IRequest<Result<MaintenanceLogPageDto>>
{
    public int AssetId { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
