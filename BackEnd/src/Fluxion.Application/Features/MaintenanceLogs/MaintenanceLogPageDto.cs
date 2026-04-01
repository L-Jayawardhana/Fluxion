using System.Text.Json.Serialization;
using Fluxion.Application.DTOs.Common;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class MaintenanceLogPageDto
{
    public MaintenanceAssetInfoDto AssetInfo { get; set; } = new();
    public PagedResult<MaintenanceLogItemDto> MaintenanceLogs { get; set; } = new();
    public List<MaintenanceCommentDto> Comments { get; set; } = new();
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public MaintenanceLogSummaryDto? SummaryStats { get; set; }
}

public class MaintenanceAssetInfoDto
{
    public int AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string CurrentCondition { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime? LastInspectedAt { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DepartmentName { get; set; }
}

public class MaintenanceLogItemDto
{
    public int LogId { get; set; }
    public int TicketId { get; set; }
    public string TicketTitle { get; set; } = string.Empty;
    public string TechnicianName { get; set; } = string.Empty;
    public string? RepairDescription { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public decimal? Cost { get; set; }
    public string? ConditionAfterRepair { get; set; }
    public DateTime LoggedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class MaintenanceCommentDto
{
    public int LogId { get; set; }
    public int TicketId { get; set; }
    public string TicketTitle { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorRole { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool? IsVisibleToEmployee { get; set; }
}

public class MaintenanceLogSummaryDto
{
    public int TotalMaintenanceCount { get; set; }
    public decimal TotalCost { get; set; }
    public List<MaintenanceTechnicianCostDto> CostPerTechnician { get; set; } = new();
    public double AverageResolutionTimeHours { get; set; }
}

public class MaintenanceTechnicianCostDto
{
    public string TechnicianName { get; set; } = string.Empty;
    public decimal TotalCost { get; set; }
    public int EventsCount { get; set; }
}
