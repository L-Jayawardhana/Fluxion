using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;
using Fluxion.Domain.Enums;

namespace Fluxion.Domain.Entities;

public class User : IAuditable
{
    [Key]
    public int UserId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; }

    public bool MustChangePassword { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public DateTime? LastLoginAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }

    public Organization Organization { get; set; } = null!;

    public ICollection<UserDepartment>? UserDepartments { get; set; }
    public ICollection<AssetAssignment>? AssetAssignments { get; set; }
}
