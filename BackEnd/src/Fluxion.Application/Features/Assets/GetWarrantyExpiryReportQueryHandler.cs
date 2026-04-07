using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets;

public class GetWarrantyExpiryReportQueryHandler
    : IRequestHandler<GetWarrantyExpiryReportQuery, Result<WarrantyExpiryReportDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetWarrantyExpiryReportQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<WarrantyExpiryReportDto>> Handle(
        GetWarrantyExpiryReportQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access.");

        var isOwner = role is "owner" or "admin" or "systemadmin";
        if (!isOwner)
            throw new ForbiddenException("This report is only available to owners.");

        // Determine the requesting user's OrgId via the Users table
        var orgId = await _db.Users
            .Where(u => u.UserId == userId.Value)
            .Select(u => (int?)u.OrgId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("User organisation not found.");

        var today = DateTime.UtcNow.Date;
        var windowEnd = today.AddDays(request.DaysAhead);

        // ── Raw asset pull (all assets in org that have a WarrantyEndDate) ────
        var assetsRaw = await (
            from a in _db.Assets
            where a.OrgId == orgId && a.WarrantyEndDate.HasValue
            join dep in _db.Departments on a.DepartmentId equals dep.DepartmentId into dGroup
            from dep in dGroup.DefaultIfEmpty()
            select new
            {
                a.AssetId,
                a.AssetName,
                a.SerialNumber,
                a.AssetType,
                a.Status,
                a.WarrantyEndDate,
                DepartmentName = dep != null ? dep.DepartmentName : (string?)null
            }
        ).ToListAsync(cancellationToken);

        // Current assignments (active — ReturnDate == null) for assigned-to name
        var assetIds = assetsRaw.Select(a => a.AssetId).ToList();
        var assignmentMap = await _db.AssetAssignments
            .Where(aa => assetIds.Contains(aa.AssetId) && aa.ReturnDate == null)
            .OrderByDescending(aa => aa.AssignedDate)
            .Join(_db.Users, aa => aa.UserId, u => u.UserId, (aa, u) => new { aa.AssetId, u.FullName })
            .ToListAsync(cancellationToken);

        // Build a deduplicated assignment dictionary (latest active assignment per asset)
        var assignedToMap = assignmentMap
            .GroupBy(x => x.AssetId)
            .ToDictionary(g => g.Key, g => g.First().FullName);

        // ── Summary stats ─────────────────────────────────────────────────────
        var totalWithWarranty = assetsRaw.Count;
        var alreadyExpiredCount = assetsRaw.Count(a => a.WarrantyEndDate!.Value.Date < today);
        var expiringSoonCount = assetsRaw.Count(a =>
            a.WarrantyEndDate!.Value.Date >= today &&
            a.WarrantyEndDate.Value.Date <= today.AddDays(30));
        var expiringThisYear = assetsRaw.Count(a =>
            a.WarrantyEndDate!.Value.Date >= today &&
            a.WarrantyEndDate.Value.Date <= today.AddDays(365));
        var healthyCount = assetsRaw.Count(a => a.WarrantyEndDate!.Value.Date > today.AddDays(365));

        var summary = new WarrantyReportSummaryDto
        {
            TotalWithWarranty = totalWithWarranty,
            AlreadyExpiredCount = alreadyExpiredCount,
            ExpiringSoonCount = expiringSoonCount,
            ExpiringThisYear = expiringThisYear,
            HealthyCount = healthyCount
        };

        // ── Mapping helper (works directly on the anonymous type from ToListAsync) ─
        static string CalcUrgency(int days) =>
            days < 0 ? "Expired" : days <= 30 ? "Critical" : days <= 90 ? "Warning" : "Upcoming";

        WarrantyAssetItemDto ToDto(int assetId, string assetName, string? serialNumber, string assetType,
            Domain.Enums.AssetStatus status, DateTime? warrantyEndDate, string? departmentName,
            Dictionary<int, string> assignMap)
        {
            var days = warrantyEndDate.HasValue
                ? (int)(warrantyEndDate.Value.Date - today).TotalDays
                : int.MaxValue;
            var urgency = CalcUrgency(days);
            return new WarrantyAssetItemDto
            {
                AssetId         = assetId,
                AssetName       = assetName,
                SerialNumber    = serialNumber,
                AssetType       = assetType,
                DepartmentName  = departmentName,
                AssignedToName  = assignMap.TryGetValue(assetId, out var n) ? n : null,
                CurrentStatus   = status.ToString(),
                WarrantyEndDate = warrantyEndDate,
                DaysUntilExpiry = days,
                UrgencyLevel    = urgency
            };
        }

        // ── Already expired (up to 50, most recently expired first) ──────────
        var expiredList = assetsRaw
            .Where(a => a.WarrantyEndDate!.Value.Date < today)
            .OrderByDescending(a => a.WarrantyEndDate)
            .Take(50)
            .Select(a => ToDto(a.AssetId, a.AssetName, a.SerialNumber, a.AssetType,
                a.Status, a.WarrantyEndDate, a.DepartmentName, assignedToMap))
            .ToList();

        // ── Expiring within DaysAhead window, paginated ───────────────────────
        var expiringAll = assetsRaw
            .Where(a => a.WarrantyEndDate!.Value.Date >= today && a.WarrantyEndDate.Value.Date <= windowEnd)
            .OrderBy(a => a.WarrantyEndDate)
            .Select(a => ToDto(a.AssetId, a.AssetName, a.SerialNumber, a.AssetType,
                a.Status, a.WarrantyEndDate, a.DepartmentName, assignedToMap))
            .ToList();

        var totalExpiring = expiringAll.Count;
        var expiringPage = expiringAll
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var pagedResult = new PagedResult<WarrantyAssetItemDto>(
            expiringPage, totalExpiring, request.PageNumber, request.PageSize);

        var dto = new WarrantyExpiryReportDto
        {
            Expiring = pagedResult,
            Expired = expiredList,
            Summary = summary
        };

        return Result<WarrantyExpiryReportDto>.Success(dto);
    }
}
