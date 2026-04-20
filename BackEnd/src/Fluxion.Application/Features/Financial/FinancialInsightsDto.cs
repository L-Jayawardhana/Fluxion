using System;
using System.Collections.Generic;

namespace Fluxion.Application.Features.Financial;

public class FinancialInsightsDto
{
    public List<DepartmentSpendDto> SpendByDepartment { get; set; } = new();
    public List<AssetCostDto> CostPerAsset { get; set; } = new();
    public List<TechnicianCostDto> CostPerTechnician { get; set; } = new();
    public List<MonthlyTrendDto> MonthlyTrends { get; set; } = new();
    public BudgetComparisonDto BudgetComparison { get; set; } = new();
}

public class DepartmentSpendDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public decimal LaborSpend { get; set; }
    public decimal PartsSpend { get; set; }
    public decimal MaintenanceSpend { get; set; }
    public decimal AssetSpend { get; set; }
    public decimal TotalSpend { get; set; }
}

public class AssetCostDto
{
    public string AssetName { get; set; } = string.Empty;
    public decimal PurchaseCost { get; set; }
    public decimal LaborCost { get; set; }
    public decimal PartsCost { get; set; }
    public decimal MaintenanceCost { get; set; }
    public decimal TotalCost { get; set; }
}

public class TechnicianCostDto
{
    public string TechnicianName { get; set; } = string.Empty;
    public decimal LaborCost { get; set; }
    public decimal PartsCost { get; set; }
    public decimal TotalCost { get; set; }
}

public class MonthlyTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal LaborSpend { get; set; }
    public decimal PartsSpend { get; set; }
    public decimal Spend { get; set; }
}

public class BudgetComparisonDto
{
    public decimal TotalBudget { get; set; }
    public decimal ActualSpend { get; set; }
    public decimal Variance { get; set; }
}
