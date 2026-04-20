using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Fluxion.Domain.Entities;

public class MaintenanceLog
{
    [Key]
    public int LogId { get; set; }

    [Required]
    public int OrgId { get; set; }

    [Required]
    public int TicketId { get; set; }

    [Required]
    public int AssetId { get; set; }

    public int? TechnicianId { get; set; }

    public DateTime RepairDate { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? RepairCost { get; set; }

    public string? RepairNotes { get; set; }

    public bool? IsVisibleToEmployee { get; set; }

    public MaintenanceTicket Ticket { get; set; } = null!;
}
