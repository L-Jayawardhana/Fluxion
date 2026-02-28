using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;
using Fluxion.Domain.Enums;

namespace Fluxion.Domain.Entities;

public class OrgSubscription : IAuditable
{
    [Key]
    public int SubId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required]
    public int PlanId { get; set; }

    [Required]
    public BillingCycle BillingCycle { get; set; }

    [Required]
    public DateTime StartedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public int? MaxUsers { get; set; }
    public int? MaxAssets { get; set; }

    [Required]
    public SubscriptionStatus Status { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
