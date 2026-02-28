using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fluxion.Domain.Entities;

public class SubscriptionPlan
{
    [Key]
    public int PlanId { get; set; }

    [Required, MaxLength(50)]
    public string PlanName { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceMonthly { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? PriceAnnual { get; set; }

    public int? MaxUsers { get; set; }
    public int? MaxAssets { get; set; }

    public string? Features { get; set; } // JSON stored as string

    public bool IsActive { get; set; } = true;

    public ICollection<OrgSubscription>? OrgSubscriptions { get; set; }
}
