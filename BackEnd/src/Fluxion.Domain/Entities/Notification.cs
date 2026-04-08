using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;

namespace Fluxion.Domain.Entities;

public class Notification : IAuditable
{
    [Key]
    public int NotificationId { get; set; }

    [Required]
    public int OrgId { get; set; }

    /// <summary>The user who should receive this notification.</summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>Notification type: asset_assigned, ticket_status_updated, asset_condition_updated</summary>
    [Required, MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    /// <summary>Optional reference to related ticket.</summary>
    public int? TicketId { get; set; }

    /// <summary>Optional reference to related asset.</summary>
    public int? AssetId { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }
}
