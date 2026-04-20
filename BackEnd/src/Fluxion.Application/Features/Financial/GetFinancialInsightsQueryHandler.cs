using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Financial;

public class GetFinancialInsightsQueryHandler : IRequestHandler<GetFinancialInsightsQuery, Result<FinancialInsightsDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetFinancialInsightsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<FinancialInsightsDto>> Handle(GetFinancialInsightsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access.");

        var isOwnerOrAdmin = role is "owner" or "admin" or "systemadmin" or "manager";
        if (!isOwnerOrAdmin)
            throw new ForbiddenException("Financial insights are only available to admins and owners.");

        var userOrgId = await _db.Users
            .Where(u => u.UserId == userId.Value)
            .Select(u => (int?)u.OrgId)
            .FirstOrDefaultAsync(cancellationToken);

        var orgId = request.OrgId ?? userOrgId
            ?? throw new UnauthorizedAccessException("User organisation not found.");

        var query = _db.MaintenanceLogs
            .Include(m => m.Ticket).ThenInclude(t => t.Asset).ThenInclude(a => a.Department)
            .Where(m => m.OrgId == orgId);

        if (request.StartDate.HasValue)
            query = query.Where(x => x.RepairDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(x => x.RepairDate <= request.EndDate.Value);

        var logs = await query.ToListAsync(cancellationToken);

        var orgDepartments = await _db.Departments
            .Where(d => d.OrgId == orgId)
            .Select(d => new { d.DepartmentId, d.DepartmentName })
            .ToListAsync(cancellationToken);

        var orgAssets = await _db.Assets
            .Where(a => a.OrgId == orgId)
            .Select(a => new { a.AssetId, a.DepartmentId, a.Cost, a.AssetName })
            .ToListAsync(cancellationToken);

        var dto = new FinancialInsightsDto();

        // 1. Spend by Department
        var assetDeptMap = orgAssets.ToDictionary(a => a.AssetId, a => a.DepartmentId);

        const int UnassignedDeptKey = -1;

        var laborByDepartment = logs
            .GroupBy(l => assetDeptMap.TryGetValue(l.AssetId, out var deptId) ? (deptId ?? UnassignedDeptKey) : UnassignedDeptKey)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.RepairCost ?? 0));

        var partsByDepartment = logs
            .GroupBy(l => assetDeptMap.TryGetValue(l.AssetId, out var deptId) ? (deptId ?? UnassignedDeptKey) : UnassignedDeptKey)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.ExternalPartsCost ?? 0));

        var assetCostByDepartment = orgAssets
            .GroupBy(a => a.DepartmentId ?? UnassignedDeptKey)
            .ToDictionary(g => g.Key, g => g.Sum(a => a.Cost ?? 0));

        var spendByDepartment = orgDepartments
            .Select(d =>
            {
                var laborSpend = laborByDepartment.TryGetValue(d.DepartmentId, out var ls) ? ls : 0m;
                var partsSpend = partsByDepartment.TryGetValue(d.DepartmentId, out var ps) ? ps : 0m;
                var maintenanceSpend = laborSpend + partsSpend;
                var assetSpend = assetCostByDepartment.TryGetValue(d.DepartmentId, out var ac) ? ac : 0m;
                return new DepartmentSpendDto
                {
                    DepartmentName = d.DepartmentName,
                    LaborSpend = laborSpend,
                    PartsSpend = partsSpend,
                    MaintenanceSpend = maintenanceSpend,
                    AssetSpend = assetSpend,
                    TotalSpend = maintenanceSpend + assetSpend
                };
            })
            .ToList();

        var unassignedLabor = laborByDepartment.TryGetValue(UnassignedDeptKey, out var uls) ? uls : 0m;
        var unassignedParts = partsByDepartment.TryGetValue(UnassignedDeptKey, out var ups) ? ups : 0m;
        var unassignedMaintenance = unassignedLabor + unassignedParts;
        var unassignedAssetCost = assetCostByDepartment.TryGetValue(UnassignedDeptKey, out var uas) ? uas : 0m;
        var unassignedTotal = unassignedMaintenance + unassignedAssetCost;
        if (unassignedTotal > 0)
        {
            spendByDepartment.Add(new DepartmentSpendDto
            {
                DepartmentName = "Unassigned",
                LaborSpend = unassignedLabor,
                PartsSpend = unassignedParts,
                MaintenanceSpend = unassignedMaintenance,
                AssetSpend = unassignedAssetCost,
                TotalSpend = unassignedTotal
            });
        }

        dto.SpendByDepartment = spendByDepartment
            .OrderByDescending(d => d.TotalSpend)
            .ToList();

        // 2. Cost Per Asset
        var laborCostByAsset = logs
            .GroupBy(l => l.AssetId)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.RepairCost ?? 0));

        var partsCostByAsset = logs
            .GroupBy(l => l.AssetId)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.ExternalPartsCost ?? 0));

        dto.CostPerAsset = orgAssets
            .GroupBy(a => a.AssetId)
            .Select(g =>
            {
                var asset = g.First();
                var laborCost = laborCostByAsset.TryGetValue(asset.AssetId, out var lc) ? lc : 0m;
                var partsCost = partsCostByAsset.TryGetValue(asset.AssetId, out var pc) ? pc : 0m;
                var maintenanceCost = laborCost + partsCost;
                var purchaseCost = asset.Cost ?? 0m;
                return new AssetCostDto
                {
                    AssetName = asset.AssetName ?? $"Asset #{asset.AssetId}",
                    PurchaseCost = purchaseCost,
                    LaborCost = laborCost,
                    PartsCost = partsCost,
                    MaintenanceCost = maintenanceCost,
                    TotalCost = purchaseCost + maintenanceCost
                };
            })
            .OrderByDescending(a => a.TotalCost)
            .Take(10)
            .ToList();

        // 3. Cost Per Technician
        var techIds = logs.Where(l => l.TechnicianId.HasValue).Select(l => l.TechnicianId!.Value).Distinct().ToList();
        var technicians = await _db.Users.Where(u => techIds.Contains(u.UserId)).ToDictionaryAsync(u => u.UserId, u => u.FullName, cancellationToken);
        
        dto.CostPerTechnician = logs
            .Where(l => l.TechnicianId.HasValue)
            .GroupBy(l => l.TechnicianId!.Value)
            .Select(g => new TechnicianCostDto
            {
                TechnicianName = technicians.TryGetValue(g.Key, out var name) ? name : "Unknown",
                LaborCost = g.Sum(l => l.RepairCost ?? 0),
                PartsCost = g.Sum(l => l.ExternalPartsCost ?? 0),
                TotalCost = g.Sum(l => (l.RepairCost ?? 0) + (l.ExternalPartsCost ?? 0))
            })
            .OrderByDescending(t => t.TotalCost)
            .ToList();

        // 4. Monthly Trends
        dto.MonthlyTrends = logs
            .GroupBy(l => new { l.RepairDate.Year, l.RepairDate.Month })
            .Select(g => new MonthlyTrendDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                LaborSpend = g.Sum(l => l.RepairCost ?? 0),
                PartsSpend = g.Sum(l => l.ExternalPartsCost ?? 0),
                Spend = g.Sum(l => (l.RepairCost ?? 0) + (l.ExternalPartsCost ?? 0))
            })
            .OrderBy(m => m.Month)
            .ToList();

        // 5. Budget vs Actual
        // As a simple example, assuming a flat monthly budget of $10,000 per active department, or just $50,000 organizational total.
        var totalMaintenanceCost = logs.Sum(l => (l.RepairCost ?? 0) + (l.ExternalPartsCost ?? 0));
        var totalAssetCost = orgAssets.Sum(a => a.Cost ?? 0);
        var totalActual = totalMaintenanceCost + totalAssetCost;
        var activeDeptsCount = await _db.Departments.CountAsync(d => d.OrgId == orgId && d.IsActive, cancellationToken);
        var totalBudget = activeDeptsCount * 5000m; // Example: $5000 per department budget

        dto.BudgetComparison = new BudgetComparisonDto
        {
            TotalBudget = totalBudget > 0 ? totalBudget : 50000m,
            ActualSpend = totalActual,
            Variance = (totalBudget > 0 ? totalBudget : 50000m) - totalActual
        };

        return Result<FinancialInsightsDto>.Success(dto);
    }
}
