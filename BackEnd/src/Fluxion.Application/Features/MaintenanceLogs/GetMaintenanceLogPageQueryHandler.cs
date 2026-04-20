using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class GetMaintenanceLogPageQueryHandler : IRequestHandler<GetMaintenanceLogPageQuery, Result<MaintenanceLogPageDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMaintenanceLogPageQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<MaintenanceLogPageDto>> Handle(GetMaintenanceLogPageQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access");

        var asset = await _db.Assets
            .Include(a => a.Department)
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId, cancellationToken);

        if (asset is null)
            throw new KeyNotFoundException("Asset not found");

        var isOwner = role == "owner" || role == "admin" || role == "systemadmin";
        var isTechnician = role == "technician";
        var isEmployee = role == "user" || role == "employee";

        List<int> assignedTicketIds = new();

        if (isEmployee)
        {
            var hasAssignment = await _db.AssetAssignments
                .AnyAsync(a => a.AssetId == request.AssetId && a.UserId == userId.Value && a.ReturnDate == null, cancellationToken);

            if (!hasAssignment)
                throw new ForbiddenException("Access denied");
        }
        else if (isTechnician)
        {
            assignedTicketIds = await _db.MaintenanceTickets
                .Where(t => t.AssetId == request.AssetId && t.AssignedTo == userId.Value)
                .Select(t => t.TicketId)
                .ToListAsync(cancellationToken);

            // Also allow access if the technician has logged repairs for this asset
            var hasRepairLogs = await _db.MaintenanceLogs
                .AnyAsync(l => l.AssetId == request.AssetId && l.TechnicianId == userId.Value, cancellationToken);

            if (assignedTicketIds.Count == 0 && !hasRepairLogs)
                throw new ForbiddenException("Access denied");
        }
        else if (!isOwner)
        {
            throw new ForbiddenException("Access denied");
        }

        var assignedToName = await _db.AssetAssignments
            .Where(a => a.AssetId == request.AssetId && a.ReturnDate == null)
            .OrderByDescending(a => a.AssignedDate)
            .Join(_db.Users, a => a.UserId, u => u.UserId, (a, u) => u.FullName)
            .FirstOrDefaultAsync(cancellationToken);

        var lastInspectedAt = await _db.MaintenanceLogs
            .Where(l => l.AssetId == request.AssetId && l.IsVisibleToEmployee == null)
            .Select(l => (DateTime?)l.RepairDate)
            .MaxAsync(cancellationToken);

        var condition = MapCondition(asset.Status);

        var assetInfo = new MaintenanceAssetInfoDto
        {
            AssetId = asset.AssetId,
            AssetName = asset.AssetName,
            SerialNumber = asset.SerialNumber,
            Category = asset.AssetType,
            CurrentStatus = asset.Status.ToString(),
            CurrentCondition = condition,
            AssignedTo = assignedToName,
            LastInspectedAt = lastInspectedAt,
            DepartmentName = isOwner ? asset.Department?.DepartmentName : null
        };

        // Primary source is Tickets to ensure all maintenance history is shown,
        // even if the technician resolved it without an explicit 'Repair Log' form submission.
        var ticketsQuery = _db.MaintenanceTickets
            .Where(t => t.AssetId == request.AssetId);

        var totalCount = await ticketsQuery.CountAsync(cancellationToken);

        var pagedLogsRaw = await (from t in ticketsQuery
                                  join l in _db.MaintenanceLogs.Where(x => x.IsVisibleToEmployee == null)
                                      on t.TicketId equals l.TicketId into lGroup
                                  from l in lGroup.DefaultIfEmpty()
                                  join u in _db.Users on (l != null ? l.TechnicianId : t.AssignedTo) equals u.UserId into uGroup
                                  from u in uGroup.DefaultIfEmpty()
                                  orderby (l != null ? l.RepairDate : t.CreatedAt) descending
                                  select new
                                  {
                                      LogId = l != null ? l.LogId : t.TicketId,
                                      TicketId = t.TicketId,
                                      TicketTitle = t.Title,
                                      TechnicianName = u != null ? u.FullName : "Technician",
                                      RepairDescription = l != null ? l.RepairNotes : t.IssueDescription,
                                      LaborCostRaw = l != null ? l.RepairCost : (decimal?)null,
                                      PartsCostRaw = l != null ? l.ExternalPartsCost : (decimal?)null,
                                      CostRaw = l != null ? (l.RepairCost ?? 0m) + (l.ExternalPartsCost ?? 0m) : (decimal?)null,
                                      LoggedAt = l != null ? l.RepairDate : t.CreatedAt,
                                      ResolvedAt = t.ClosedAt
                                  })
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var pagedLogs = pagedLogsRaw.Select(l => new MaintenanceLogItemDto
        {
            LogId = l.LogId,
            TicketId = l.TicketId,
            TicketTitle = l.TicketTitle,
            TechnicianName = l.TechnicianName,
            RepairDescription = l.RepairDescription,
            LaborCost = isEmployee ? null : l.LaborCostRaw,
            PartsCost = isEmployee ? null : l.PartsCostRaw,
            Cost = isEmployee ? null : l.CostRaw,
            ConditionAfterRepair = condition,
            LoggedAt = l.LoggedAt,
            ResolvedAt = l.ResolvedAt
        }).ToList();

        var pagedResult = new PagedResult<MaintenanceLogItemDto>(pagedLogs, totalCount, request.PageNumber, request.PageSize);

        var commentsQuery = _db.MaintenanceLogs
            .Where(l => l.AssetId == request.AssetId && l.IsVisibleToEmployee.HasValue);

        if (isEmployee)
            commentsQuery = commentsQuery.Where(l => l.IsVisibleToEmployee == true);

        var commentsRaw = await (from l in commentsQuery
                                 join t in _db.MaintenanceTickets on l.TicketId equals t.TicketId
                                 join u in _db.Users on l.TechnicianId equals u.UserId into uGroup
                                 from u in uGroup.DefaultIfEmpty()
                                 orderby l.RepairDate
                                 select new
                                 {
                                     LogId = l.LogId,
                                     TicketId = l.TicketId,
                                     TicketTitle = t.Title,
                                     AuthorName = u != null ? u.FullName : "Technician",
                                     RoleRaw = u != null ? (UserRole?)u.Role : null,
                                     ContentRaw = l.RepairNotes,
                                     CreatedAt = l.RepairDate,
                                     IsVisibleToEmployee = l.IsVisibleToEmployee
                                 })
            .ToListAsync(cancellationToken);

        var comments = commentsRaw.Select(c => new MaintenanceCommentDto
        {
            LogId = c.LogId,
            TicketId = c.TicketId,
            TicketTitle = c.TicketTitle,
            AuthorName = c.AuthorName,
            AuthorRole = c.RoleRaw.HasValue ? c.RoleRaw.Value.ToString() : "technician",
            Content = c.ContentRaw ?? string.Empty,
            CreatedAt = c.CreatedAt,
            IsVisibleToEmployee = c.IsVisibleToEmployee
        }).ToList();

        MaintenanceLogSummaryDto? summary = null;
        if (isOwner)
        {
            var summaryQuery = _db.MaintenanceLogs
                .Where(l => l.AssetId == request.AssetId && l.IsVisibleToEmployee == null);

            var totalMaintenanceCount = await summaryQuery.CountAsync(cancellationToken);
            var laborCost = await summaryQuery
                .SumAsync(l => l.RepairCost ?? 0m, cancellationToken);
            var partsCost = await summaryQuery
                .SumAsync(l => l.ExternalPartsCost ?? 0m, cancellationToken);
            var totalCost = await summaryQuery
                .SumAsync(l => (l.RepairCost ?? 0m) + (l.ExternalPartsCost ?? 0m), cancellationToken);

            var costPerTechRaw = await summaryQuery
                .GroupBy(l => l.TechnicianId)
                .Select(g => new
                {
                    TechnicianId = g.Key,
                    LaborCost = g.Sum(x => x.RepairCost ?? 0m),
                    PartsCost = g.Sum(x => x.ExternalPartsCost ?? 0m),
                    TotalCost = g.Sum(x => (x.RepairCost ?? 0m) + (x.ExternalPartsCost ?? 0m)),
                    EventsCount = g.Count()
                })
                .ToListAsync(cancellationToken);

            var techIds = costPerTechRaw
                .Where(c => c.TechnicianId.HasValue)
                .Select(c => c.TechnicianId!.Value)
                .ToList();

            var techNameMap = await _db.Users
                .Where(u => techIds.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId, u => u.FullName, cancellationToken);

            var costPerTech = costPerTechRaw
                .Select(c => new MaintenanceTechnicianCostDto
                {
                    TechnicianName = c.TechnicianId.HasValue && techNameMap.TryGetValue(c.TechnicianId.Value, out var name)
                        ? name
                        : "Technician",
                    LaborCost = c.LaborCost,
                    PartsCost = c.PartsCost,
                    TotalCost = c.TotalCost,
                    EventsCount = c.EventsCount
                })
                .OrderByDescending(c => c.TotalCost)
                .ToList();

            var datePairs = await _db.MaintenanceTickets
                .Where(t => t.AssetId == request.AssetId && t.ClosedAt.HasValue)
                .Select(t => new { t.CreatedAt, ClosedAt = t.ClosedAt!.Value })
                .ToListAsync(cancellationToken);

            var avgResolutionHours = datePairs.Any()
                ? datePairs.Average(t => (t.ClosedAt - t.CreatedAt).TotalHours)
                : 0;

            summary = new MaintenanceLogSummaryDto
            {
                TotalMaintenanceCount = totalMaintenanceCount,
                LaborCost = laborCost,
                PartsCost = partsCost,
                TotalCost = totalCost,
                CostPerTechnician = costPerTech,
                AverageResolutionTimeHours = Math.Round(avgResolutionHours, 1)
            };
        }

        var dto = new MaintenanceLogPageDto
        {
            AssetInfo = assetInfo,
            MaintenanceLogs = pagedResult,
            Comments = comments,
            SummaryStats = summary
        };

        return Result<MaintenanceLogPageDto>.Success(dto);
    }

    private static string MapCondition(AssetStatus status)
    {
        return status switch
        {
            AssetStatus.available => "Good",
            AssetStatus.assigned => "Fair",
            AssetStatus.under_maintenance => "Poor",
            AssetStatus.retired => "Critical",
            _ => "Unknown"
        };
    }
}
