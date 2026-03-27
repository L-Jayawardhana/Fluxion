using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;
using Fluxion.Domain.Enums;

namespace Fluxion.Domain.Entities;

public class MaintenanceTicket : IAuditable
{
    [Key]
    public int TicketId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required]
    public int AssetId { get; set; }

    public int? AssignmentId { get; set; }

    [Required]
    public int RaisedBy { get; set; }

    public int? AssignedTo { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string IssueDescription { get; set; } = string.Empty;

    [Required]
    public TicketPriority Priority { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }

    [Required]
    public TicketStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Asset Asset { get; set; } = null!;
}
