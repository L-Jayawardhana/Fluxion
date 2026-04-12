using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/technician")]
[Authorize(Roles = "technician,admin,owner")]
public class TechnicianController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly ITicketAlertEmailService _alertEmailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TechnicianController> _logger;

    public TechnicianController(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        ITicketAlertEmailService alertEmailService,
        INotificationService notificationService,
        ILogger<TechnicianController> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _alertEmailService = alertEmailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    // ── helper ───────────────────────────────────────────────
    private int GetTechnicianId()
    {
        if (_currentUser.UserId == null)
            throw new UnauthorizedAccessException("Not authenticated.");
        return _currentUser.UserId.Value;
    }

    // ─────────────────────────────────────────────────────────
    // GET /api/technician/dashboard/stats
    // ─────────────────────────────────────────────────────────
    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var tickets = await _db.MaintenanceTickets
            .Where(t => t.AssignedTo == techId)
            .ToListAsync(ct);

        var recentActivity = await _db.MaintenanceTickets
            .Where(t => t.AssignedTo == techId)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(5)
            .Select(t => new
            {
                t.TicketId,
                t.Title,
                t.Status,
                t.UpdatedAt
            })
            .ToListAsync(ct);

        var stats = new
        {
            totalAssigned = tickets.Count,
            openTickets = tickets.Count(t => t.Status == TicketStatus.open || t.Status == TicketStatus.assigned),
            inProgress = tickets.Count(t => t.Status == TicketStatus.in_progress || t.Status == TicketStatus.waiting_parts),
            resolved = tickets.Count(t => t.Status == TicketStatus.resolved || t.Status == TicketStatus.closed),
            priorityCounts = new
            {
                low = tickets.Count(t => t.Priority == TicketPriority.low),
                medium = tickets.Count(t => t.Priority == TicketPriority.medium),
                high = tickets.Count(t => t.Priority == TicketPriority.high),
                critical = tickets.Count(t => t.Priority == TicketPriority.critical),
            },
            recentActivity
        };

        return Ok(stats);
    }

    // ─────────────────────────────────────────────────────────
    // GET /api/technician/dashboard/performance
    // ─────────────────────────────────────────────────────────
    [HttpGet("dashboard/performance")]
    public async Task<IActionResult> GetPerformance(CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var resolvedTickets = await _db.MaintenanceTickets
            .Where(t => t.AssignedTo == techId &&
                        (t.Status == TicketStatus.resolved || t.Status == TicketStatus.closed))
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var resolvedThisMonth = resolvedTickets.Count(t => t.ClosedAt >= startOfMonth);

        // Average resolution time (hours): ClosedAt - CreatedAt
        var withClosedAt = resolvedTickets.Where(t => t.ClosedAt.HasValue).ToList();
        double avgResolutionHours = withClosedAt.Count > 0
            ? withClosedAt.Average(t => (t.ClosedAt!.Value - t.CreatedAt).TotalHours)
            : 0;

        // Total repair cost from maintenance logs
        var totalCost = await _db.MaintenanceLogs
            .Where(l => l.TechnicianId == techId && l.RepairCost.HasValue)
            .SumAsync(l => l.RepairCost!.Value, ct);

        return Ok(new
        {
            totalResolved = resolvedTickets.Count,
            resolvedThisMonth,
            avgResolutionHours = Math.Round(avgResolutionHours, 1),
            totalRepairCost = totalCost
        });
    }

    // ─────────────────────────────────────────────────────────
    // GET /api/technician/tickets
    // ─────────────────────────────────────────────────────────
    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        int techId = GetTechnicianId();

        var query = _db.MaintenanceTickets
            .Include(t => t.Asset)
            .Where(t => t.AssignedTo == techId);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TicketStatus>(status, true, out var parsedStatus))
            query = query.Where(t => t.Status == parsedStatus);

        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<TicketPriority>(priority, true, out var parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        if (dateFrom.HasValue) query = query.Where(t => t.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
        {
            var dt = dateTo.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(t => t.CreatedAt <= dt);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(kw) || t.IssueDescription.ToLower().Contains(kw));
        }

        var total = await query.CountAsync(ct);

        var tickets = await (from t in query.OrderByDescending(t => t.CreatedAt)
                                            .Skip((page - 1) * pageSize).Take(pageSize)
                             join ru in _db.Users on t.RaisedBy equals ru.UserId into ruG
                             from ru in ruG.DefaultIfEmpty()
                             select new
                             {
                                 t.TicketId,
                                 t.Title,
                                 t.Status,
                                 t.Priority,
                                 t.CreatedAt,
                                 assetName = t.Asset.AssetName,
                                 reportedBy = ru != null ? ru.FullName : "",
                                 cost = (decimal?)null  // will be filled from logs if needed
                             }).ToListAsync(ct);

        // Enrich with cost from maintenance logs
        var ticketIds = tickets.Select(t => t.TicketId).ToList();
        var costs = await _db.MaintenanceLogs
            .Where(l => ticketIds.Contains(l.TicketId) && l.RepairCost.HasValue)
            .GroupBy(l => l.TicketId)
            .Select(g => new { ticketId = g.Key, totalCost = g.Sum(l => l.RepairCost!.Value) })
            .ToListAsync(ct);

        var costMap = costs.ToDictionary(c => c.ticketId, c => c.totalCost);

        var result = tickets.Select(t => new
        {
            t.TicketId,
            t.Title,
            t.Status,
            t.Priority,
            t.CreatedAt,
            t.assetName,
            t.reportedBy,
            cost = costMap.TryGetValue(t.TicketId, out var c) ? (decimal?)c : null
        });

        return Ok(new { total, page, pageSize, items = result });
    }

    // ─────────────────────────────────────────────────────────
    // GET /api/technician/tickets/:id
    // ─────────────────────────────────────────────────────────
    [HttpGet("tickets/{id:int}")]
    public async Task<IActionResult> GetTicketDetail(int id, CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var ticket = await _db.MaintenanceTickets
            .Include(t => t.Asset)
            .FirstOrDefaultAsync(t => t.TicketId == id && t.AssignedTo == techId, ct);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found or not assigned to you." });

        // Reporter info
        var reporter = await _db.Users
            .Where(u => u.UserId == ticket.RaisedBy)
            .Select(u => new { u.UserId, u.FullName, u.Email })
            .FirstOrDefaultAsync(ct);

        // Reporter's department
        var reporterDept = reporter != null
            ? await _db.UserDepartments
                .Where(ud => ud.UserId == reporter.UserId)
                .Join(_db.Departments, ud => ud.DepartmentId, d => d.DepartmentId, (ud, d) => d.DepartmentName)
                .FirstOrDefaultAsync(ct)
            : null;

        // Asset department 
        var assetDept = ticket.Asset.DepartmentId.HasValue
            ? await _db.Departments
                .Where(d => d.DepartmentId == ticket.Asset.DepartmentId.Value)
                .Select(d => d.DepartmentName)
                .FirstOrDefaultAsync(ct)
            : null;

        // Comments
        var comments = await _db.MaintenanceLogs
            .Where(l => l.TicketId == id && l.RepairNotes != null)
            .OrderBy(l => l.RepairDate)
            .Select(l => new
            {
                logId = l.LogId,
                content = l.RepairNotes,
                createdAt = l.RepairDate,
                authorName = _db.Users.Where(u => u.UserId == l.TechnicianId).Select(u => u.FullName).FirstOrDefault() ?? "Technician"
            })
            .ToListAsync(ct);

        // Maintenance history for same asset (last 5, excluding current)
        var history = await _db.MaintenanceTickets
            .Where(t => t.AssetId == ticket.AssetId && t.TicketId != id)
            .OrderByDescending(t => t.ClosedAt ?? t.CreatedAt)
            .Take(5)
            .Select(t => new { t.TicketId, t.Title, t.Status, t.ClosedAt })
            .ToListAsync(ct);

        return Ok(new
        {
            ticketId = ticket.TicketId,
            title = ticket.Title,
            issueDescription = ticket.IssueDescription,
            status = ticket.Status,
            priority = ticket.Priority,
            category = ticket.Category,
            createdAt = ticket.CreatedAt,
            closedAt = ticket.ClosedAt,
            asset = new
            {
                assetId = ticket.Asset.AssetId,
                assetName = ticket.Asset.AssetName,
                serialNumber = ticket.Asset.SerialNumber,
                assetType = ticket.Asset.AssetType,
                status = ticket.Asset.Status,
                department = assetDept
            },
            reporter = reporter == null ? null : new
            {
                name = reporter.FullName,
                email = reporter.Email,
                department = reporterDept
            },
            comments,
            maintenanceHistory = history
        });
    }

    // ─────────────────────────────────────────────────────────
    // PATCH /api/technician/tickets/:id/status
    // ─────────────────────────────────────────────────────────
    [HttpPatch("tickets/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req, CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var ticket = await _db.MaintenanceTickets
            .Include(t => t.Asset)
            .FirstOrDefaultAsync(t => t.TicketId == id && t.AssignedTo == techId, ct);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found or not assigned to you." });

        if (!Enum.TryParse<TicketStatus>(req.Status, true, out var newStatus))
            return BadRequest(new { message = $"Invalid status '{req.Status}'." });

        var oldStatus = ticket.Status;
        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;
        if (newStatus == TicketStatus.resolved || newStatus == TicketStatus.closed)
            ticket.ClosedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // ── Send email notification to the user who raised the ticket ──
        try
        {
            var reporter = await _db.Users
                .FirstOrDefaultAsync(u => u.UserId == ticket.RaisedBy, ct);
            var technician = await _db.Users
                .FirstOrDefaultAsync(u => u.UserId == techId, ct);

            if (reporter != null)
            {
                await _alertEmailService.SendTicketStatusUpdatedEmailAsync(
                    toEmail:        reporter.Email,
                    recipientName:  reporter.FullName,
                    ticketId:       ticket.TicketId,
                    ticketTitle:    ticket.Title,
                    oldStatus:      oldStatus.ToString(),
                    newStatus:      newStatus.ToString(),
                    technicianName: technician?.FullName ?? "A technician",
                    assetName:      ticket.Asset?.AssetName ?? "Unknown Asset"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ticket status update email for ticket {TicketId}", id);
        }

        // ── Persist in-app notification ──
        {
            var reporter = await _db.Users.FirstOrDefaultAsync(u => u.UserId == ticket.RaisedBy, ct);
            var techUser = await _db.Users.FirstOrDefaultAsync(u => u.UserId == techId, ct);
            if (reporter != null)
            {
                var statusLabel = newStatus.ToString().Replace("_", " ");
                await _notificationService.CreateNotificationAsync(
                    orgId:    ticket.OrgId,
                    userId:   reporter.UserId,
                    type:     "ticket_status_updated",
                    title:    "Ticket Status Updated",
                    message:  $"Your ticket \"{ticket.Title}\" has been updated to {statusLabel} by {techUser?.FullName ?? "a technician"}.",
                    ticketId: ticket.TicketId,
                    assetId:  ticket.AssetId,
                    ct:       ct
                );
            }
        }

        return Ok(new { message = "Status updated.", status = ticket.Status });
    }

    // ─────────────────────────────────────────────────────────
    // PUT /api/technician/tickets/:id/repair
    // ─────────────────────────────────────────────────────────
    [HttpPut("tickets/{id:int}/repair")]
    public async Task<IActionResult> LogRepair(int id, [FromBody] LogRepairRequest req, CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var ticket = await _db.MaintenanceTickets
            .FirstOrDefaultAsync(t => t.TicketId == id && t.AssignedTo == techId, ct);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found or not assigned to you." });

        if (ticket.Status != TicketStatus.in_progress)
            return BadRequest(new { message = "Repair log can only be submitted for In Progress tickets." });

        var log = new Fluxion.Domain.Entities.MaintenanceLog
        {
            OrgId = ticket.OrgId,
            TicketId = id,
            AssetId = ticket.AssetId,
            TechnicianId = techId,
            RepairDate = DateTime.UtcNow,
            RepairCost = req.Cost,
            RepairNotes = req.RepairDescription,
            IsVisibleToEmployee = null
        };

        _db.MaintenanceLogs.Add(log);
        ticket.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Repair log saved.", logId = log.LogId });
    }

    // ─────────────────────────────────────────────────────────
    // POST /api/technician/tickets/:id/comments
    // ─────────────────────────────────────────────────────────
    [HttpPost("tickets/{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddCommentRequest req, CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var ticket = await _db.MaintenanceTickets
            .FirstOrDefaultAsync(t => t.TicketId == id && t.AssignedTo == techId, ct);

        if (ticket is null)
            return NotFound(new { message = "Ticket not found or not assigned to you." });

        var comment = new Fluxion.Domain.Entities.MaintenanceLog
        {
            OrgId = ticket.OrgId,
            TicketId = id,
            AssetId = ticket.AssetId,
            TechnicianId = techId,
            RepairDate = DateTime.UtcNow,
            RepairCost = null,
            RepairNotes = req.Content,
            IsVisibleToEmployee = req.IsVisibleToEmployee ?? true
        };

        _db.MaintenanceLogs.Add(comment);
        await _db.SaveChangesAsync(ct);

        var author = await _db.Users.Where(u => u.UserId == techId).Select(u => u.FullName).FirstOrDefaultAsync(ct);

        return Ok(new
        {
            logId = comment.LogId,
            content = comment.RepairNotes,
            createdAt = comment.RepairDate,
            authorName = author ?? "Technician"
        });
    }

    // ─────────────────────────────────────────────────────────
    // GET /api/technician/assets
    // Returns distinct assets this technician has been assigned to
    // (via tickets or direct repair logs) — used by the maintenance
    // log asset picker.
    // ─────────────────────────────────────────────────────────
    [HttpGet("assets")]
    public async Task<IActionResult> GetTechnicianAssets(CancellationToken ct)
    {
        int techId = GetTechnicianId();

        // Asset IDs from assigned tickets
        var assetIdsFromTickets = await _db.MaintenanceTickets
            .Where(t => t.AssignedTo == techId)
            .Select(t => t.AssetId)
            .Distinct()
            .ToListAsync(ct);

        // Asset IDs from direct repair logs
        var assetIdsFromLogs = await _db.MaintenanceLogs
            .Where(l => l.TechnicianId == techId)
            .Select(l => l.AssetId)
            .Distinct()
            .ToListAsync(ct);

        var allAssetIds = assetIdsFromTickets.Union(assetIdsFromLogs).Distinct().ToList();

        if (allAssetIds.Count == 0)
            return Ok(Array.Empty<object>());

        var assets = await _db.Assets
            .Where(a => allAssetIds.Contains(a.AssetId))
            .Select(a => new
            {
                assetId      = a.AssetId,
                assetName    = a.AssetName,
                assetType    = a.AssetType,
                serialNumber = a.SerialNumber,
                status       = a.Status.ToString()
            })
            .OrderBy(a => a.assetName)
            .ToListAsync(ct);

        return Ok(assets);
    }

    // ─────────────────────────────────────────────────────────
    // PATCH /api/technician/assets/:assetId/condition
    // ─────────────────────────────────────────────────────────
    [HttpPatch("assets/{assetId:int}/condition")]
    public async Task<IActionResult> UpdateAssetCondition(int assetId, [FromBody] UpdateConditionRequest req, CancellationToken ct)
    {
        int techId = GetTechnicianId();

        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.AssetId == assetId, ct);
        if (asset is null)
            return NotFound(new { message = "Asset not found." });

        if (!Enum.TryParse<AssetStatus>(req.Condition, true, out var newCondition))
            return BadRequest(new { message = $"Invalid condition '{req.Condition}'." });

        var oldCondition = asset.Status;
        asset.Status = newCondition;
        asset.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // ── Send email to the currently assigned user ──
        try
        {
            var currentAssignment = await _db.AssetAssignments
                .Include(aa => aa.User)
                .Where(aa => aa.AssetId == assetId && aa.ReturnDate == null)
                .OrderByDescending(aa => aa.AssignedDate)
                .FirstOrDefaultAsync(ct);

            var technician = await _db.Users
                .FirstOrDefaultAsync(u => u.UserId == techId, ct);

            if (currentAssignment?.User != null)
            {
                await _alertEmailService.SendAssetConditionUpdatedEmailAsync(
                    toEmail:        currentAssignment.User.Email,
                    recipientName:  currentAssignment.User.FullName,
                    assetName:      asset.AssetName,
                    assetType:      asset.AssetType,
                    serialNumber:   asset.SerialNumber,
                    oldCondition:   oldCondition.ToString(),
                    newCondition:   newCondition.ToString(),
                    technicianName: technician?.FullName ?? "A technician"
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send asset condition update email for asset {AssetId}", assetId);
        }

        // ── Persist in-app notification ──
        {
            var currentAssign = await _db.AssetAssignments
                .Where(aa => aa.AssetId == assetId && aa.ReturnDate == null)
                .OrderByDescending(aa => aa.AssignedDate)
                .FirstOrDefaultAsync(ct);
            var techUser = await _db.Users.FirstOrDefaultAsync(u => u.UserId == techId, ct);

            if (currentAssign != null)
            {
                var condLabel = newCondition.ToString().Replace("_", " ");
                await _notificationService.CreateNotificationAsync(
                    orgId:   asset.OrgId,
                    userId:  currentAssign.UserId,
                    type:    "asset_condition_updated",
                    title:   "Asset Condition Updated",
                    message: $"The condition of {asset.AssetName} has been updated to {condLabel} by {techUser?.FullName ?? "a technician"}.",
                    assetId: asset.AssetId,
                    ct:      ct
                );
            }
        }

        return Ok(new { message = "Asset condition updated.", condition = asset.Status });
    }
}

// ── Request DTOs ─────────────────────────────────────────────
public record UpdateStatusRequest(string Status);
public record LogRepairRequest(string RepairDescription, decimal? Cost);
public record AddCommentRequest(string Content, bool? IsVisibleToEmployee = null);
public record UpdateConditionRequest(string Condition);
