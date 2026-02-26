using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;

namespace Fluxion.Domain.Entities;

public class AssetAssignment : IAuditable
{
    [Key]
    public int AssignmentId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required]
    public int AssetId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int AssignedBy { get; set; }

    public DateTime AssignedDate { get; set; }

    public DateTime? ReturnDate { get; set; }

    public string? Notes { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Asset Asset { get; set; } = null!;
    public User User { get; set; } = null!;
}
