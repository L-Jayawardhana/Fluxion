using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class GetMaintenanceCostReportQueryHandler 
    : IRequestHandler<GetMaintenanceCostReportQuery, Result<MaintenanceCostReportDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMaintenanceCostReportQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<MaintenanceCostReportDto>> Handle(
        GetMaintenanceCostReportQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access.");

        var isOwnerOrAdmin = role is "owner" or "admin" or "systemadmin" or "manager";
        if (!isOwnerOrAdmin)
            throw new ForbiddenException("This report is only available to owners and admins.");

        var orgId = await _db.Users
            .Where(u => u.UserId == userId.Value)
            .Select(u => (int?)u.OrgId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("User organisation not found.");

        var query = _db.MaintenanceLogs
            .Include(x => x.Ticket)
            .Where(x => x.OrgId == orgId);

        if (request.StartDate.HasValue)
        {
            query = query.Where(x => x.RepairDate >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            query = query.Where(x => x.RepairDate <= request.EndDate.Value);
        }

        var aggregatedDataQuery = query
            .GroupBy(x => x.AssetId)
            .Select(g => new 
            {
                AssetId = g.Key,
                MaintenanceCount = g.Count(),
                TotalCost = g.Sum(x => x.RepairCost ?? 0)
            });

        var totalItems = await aggregatedDataQuery.CountAsync(cancellationToken);

        var pageData = await aggregatedDataQuery
            .OrderByDescending(x => x.TotalCost)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Join(_db.Assets, 
                g => g.AssetId, 
                a => a.AssetId, 
                (g, a) => new MaintenanceCostReportItemDto
                {
                    AssetId = a.AssetId,
                    AssetName = a.AssetName,
                    AssetTag = a.SerialNumber ?? a.AssetType ?? "N/A",
                    MaintenanceCount = g.MaintenanceCount,
                    TotalCost = g.TotalCost
                })
            .ToListAsync(cancellationToken);

        foreach (var item in pageData)
        {
            item.Details = await query
                .Where(x => x.AssetId == item.AssetId)
                .OrderByDescending(x => x.RepairDate)
                .Select(x => new MaintenanceCostDetailDto
                {
                    LogId = x.LogId,
                    RepairDate = x.RepairDate,
                    Cost = x.RepairCost ?? 0,
                    Remarks = x.RepairNotes
                })
                .ToListAsync(cancellationToken);
        }

        var pagedResult = new PagedResult<MaintenanceCostReportItemDto>(pageData, totalItems, request.PageNumber, request.PageSize);

        var dto = new MaintenanceCostReportDto
        {
            Data = pagedResult
        };

        return Result<MaintenanceCostReportDto>.Success(dto);
    }
}
