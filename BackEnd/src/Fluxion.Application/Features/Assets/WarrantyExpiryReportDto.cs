using Fluxion.Application.DTOs.Common;

namespace Fluxion.Application.Features.Assets;

public class WarrantyExpiryReportDto
{
    /// <summary>Assets whose warranty expires within the requested window, paginated.</summary>
    public PagedResult<WarrantyAssetItemDto> Expiring { get; set; } = new();

    /// <summary>Assets whose warranty has already expired (unpaginated, latest 50).</summary>
    public List<WarrantyAssetItemDto> Expired { get; set; } = new();

    /// <summary>High-level counts for the stat bar.</summary>
    public WarrantyReportSummaryDto Summary { get; set; } = new();
}

public class WarrantyAssetItemDto
{
    public int AssetId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string AssetType { get; set; } = string.Empty;
    public string? DepartmentName { get; set; }
    public string? AssignedToName { get; set; }
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime? WarrantyEndDate { get; set; }

    /// <summary>Negative = already expired. Positive = days remaining.</summary>
    public int DaysUntilExpiry { get; set; }

    /// <summary>Urgency level derived from DaysUntilExpiry.</summary>
    public string UrgencyLevel { get; set; } = string.Empty; // "Expired" | "Critical" | "Warning" | "Upcoming"
}

public class WarrantyReportSummaryDto
{
    public int TotalWithWarranty { get; set; }
    public int AlreadyExpiredCount { get; set; }
    public int ExpiringSoonCount { get; set; }    // within 30 days
    public int ExpiringThisYear { get; set; }     // within 365 days
    public int HealthyCount { get; set; }         // > 365 days remaining
}
