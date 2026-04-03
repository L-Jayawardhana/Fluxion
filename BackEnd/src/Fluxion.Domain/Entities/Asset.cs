using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Fluxion.Domain.Base;
using Fluxion.Domain.Enums;

namespace Fluxion.Domain.Entities;

public class Asset : IAuditable
{
    [Key]
    public int AssetId { get; set; }

    [Required]
    public int OrgId { get; set; }

    public int? DepartmentId { get; set; }

    [Required, MaxLength(100)]
    public string AssetName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string AssetType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? AssetTag { get; set; }

    [MaxLength(100)]
    public string? SerialNumber { get; set; }

    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyEndDate { get; set; }
    public bool IsWarrantyExpiryNotified { get; set; } = false;

    [Column(TypeName = "decimal(10,2)")]
    public decimal? Cost { get; set; }

    [Required]
    public AssetStatus Status { get; set; }

    public string? QrCode { get; set; }

    public DateTime? RetiredAt { get; set; }
    public int? RetiredBy { get; set; }

    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public Department? Department { get; set; }

    public ICollection<AssetAssignment>? Assignments { get; set; }
}
