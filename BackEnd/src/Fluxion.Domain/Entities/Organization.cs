using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;

namespace Fluxion.Domain.Entities;

public class Organization : IAuditable
{
    [Key]
    public int OrgId { get; set; }

    [Required, MaxLength(150)]
    public string OrgName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    public int? OwnerId { get; set; } // Plain INT (no FK)

    [MaxLength(255)]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    public string? Timezone { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }

    public ICollection<User>? Users { get; set; }
    public ICollection<Department>? Departments { get; set; }
    public ICollection<Asset>? Assets { get; set; }
}
