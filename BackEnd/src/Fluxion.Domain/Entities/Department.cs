using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;

namespace Fluxion.Domain.Entities;

public class Department : IAuditable
{
    [Key]
    public int DepartmentId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required, MaxLength(100)]
    public string DepartmentName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(150)]
    public string? Location { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public ICollection<UserDepartment>? UserDepartments { get; set; }
}
