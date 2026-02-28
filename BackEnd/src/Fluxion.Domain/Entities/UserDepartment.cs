using System.ComponentModel.DataAnnotations;

namespace Fluxion.Domain.Entities;

public class UserDepartment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int DepartmentId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Department Department { get; set; } = null!;
}
