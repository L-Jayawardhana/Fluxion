using System.ComponentModel.DataAnnotations;
using Fluxion.Domain.Base;
using Fluxion.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fluxion.Domain.Entities;

public class MaintenanceSchedule : IAuditable
{
    [Key]
    public int ScheduleId { get; set; }

    [Required]
    public int OrgId { get; set; }

    public int? AssetId { get; set; }
    
    public string? AssetType { get; set; }

    [Required]
    public int CreatedByManagerId { get; set; }

    public int? AssignedTechnicianId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string TaskDescription { get; set; } = string.Empty;

    [Required]
    public int IntervalDays { get; set; }

    [Required]
    public DateTime NextDueDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
}