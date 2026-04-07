using System;
using Fluxion.Domain.Enums;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class MaintenanceTicketSummaryDto
{
    public int TicketId { get; set; }
    public string Title { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string ReportedByUserName { get; set; } = string.Empty;
    public string? AssignedTechnicianName { get; set; }
    public int? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? Cost { get; set; } // if applicable, might need to map from logs or similar, but adding as requested
}
