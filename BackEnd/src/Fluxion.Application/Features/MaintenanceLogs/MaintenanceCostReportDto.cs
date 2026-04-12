using Fluxion.Application.DTOs.Common;

namespace Fluxion.Application.Features.MaintenanceLogs;

public record MaintenanceCostReportDto
{
    public required PagedResult<MaintenanceCostReportItemDto> Data { get; init; }
}

public record MaintenanceCostReportItemDto
{
    public required int AssetId { get; init; }
    public required string AssetName { get; init; }
    public required string AssetTag { get; init; }
    public required int MaintenanceCount { get; init; }
    public required decimal LaborCost { get; init; }
    public required decimal PartsCost { get; init; }
    public required decimal TotalCost { get; init; }
    public List<MaintenanceCostDetailDto> Details { get; set; } = new();
}

public record MaintenanceCostDetailDto
{
    public required int LogId { get; init; }
    public required DateTime RepairDate { get; init; }
    public required decimal LaborCost { get; init; }
    public required decimal PartsCost { get; init; }
    public required decimal Cost { get; init; }
    public string? Remarks { get; init; }
}
