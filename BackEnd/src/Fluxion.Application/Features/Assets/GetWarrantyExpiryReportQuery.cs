using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.Assets;

public record GetWarrantyExpiryReportQuery : IRequest<Result<WarrantyExpiryReportDto>>
{
    /// <summary>Days ahead to look for expiring warranties. Default = 90.</summary>
    public int DaysAhead { get; init; } = 90;
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
