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

        var orgId = await _db.Users
            .Where(u => u.UserId == userId.Value)
            .Select(u => (int?)u.OrgId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedAccessException("User organisation not found.");

        var query = _db.MaintenanceLogs
            .Include(m => m.Ticket).ThenInclude(t => t.Asset).ThenInclude(a => a.Department)
            .Where(m => m.OrgId == orgId && m.RepairCost.HasValue);

        if (request.StartDate.HasValue)
            query = query.Where(x => x.RepairDate >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(x => x.RepairDate <= request.EndDate.Value);

        var logs = await query.ToListAsync(cancellationToken);

        var dto = new FinancialInsightsDto();

        // 1. Spend by Department
        dto.SpendByDepartment = logs
            .GroupBy(l => l.Ticket.Asset.Department?.DepartmentName ?? "Unassigned")
            .Select(g => new DepartmentSpendDto
            {
                DepartmentName = g.Key,
                TotalSpend = g.Sum(l => l.RepairCost!.Value)
            })
            .OrderByDescending(d => d.TotalSpend)
            .ToList();

        // 2. Cost Per Asset
        dto.CostPerAsset = logs
            .GroupBy(l => l.Ticket.Asset.AssetName)
            .Select(g => new AssetCostDto
            {
                AssetName = g.Key,
                TotalCost = g.Sum(l => l.RepairCost!.Value)
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
                TotalCost = g.Sum(l => l.RepairCost!.Value)
            })
            .OrderByDescending(t => t.TotalCost)
            .ToList();

        // 4. Monthly Trends
        dto.MonthlyTrends = logs
            .GroupBy(l => new { l.RepairDate.Year, l.RepairDate.Month })
            .Select(g => new MonthlyTrendDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                Spend = g.Sum(l => l.RepairCost!.Value)
            })
            .OrderBy(m => m.Month)
            .ToList();

        // 5. Budget vs Actual
        // As a simple example, assuming a flat monthly budget of $10,000 per active department, or just $50,000 organizational total.
        var totalActual = logs.Sum(l => l.RepairCost!.Value);
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
