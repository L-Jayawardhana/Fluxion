using FluentAssertions;
using Fluxion.Application.Features.Financial;
using Fluxion.Domain.Entities;
using Fluxion.Persistence.Context;
using Fluxion.UnitTests.Helpers;
using Moq;
using Fluxion.Application.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Fluxion.UnitTests.MaintenanceLogs;

public class GetFinancialInsightsQueryHandlerTests
{
    private sealed class FakeCurrentUserService : ICurrentUserService
    {
        public int? UserId { get; set; } = 1;
        public string? Role { get; set; } = "Admin";
        public string? OrgId { get; set; } = "1";
    }

    private static FluxionDbContext CreateDb() => InMemoryDbContextFactory.Create();

    [Fact]
    public async Task Handle_ReturnsCorrectAggregatedFinancialInsights()
    {
        // Arrange
        using var context = CreateDb();
        var currentUser = new FakeCurrentUserService();
        var handler = new GetFinancialInsightsQueryHandler(context, currentUser);

        var dept1 = new Department { DepartmentId = 1, OrgId = 1, DepartmentName = "IT", IsActive = true };
        var dept2 = new Department { DepartmentId = 2, OrgId = 1, DepartmentName = "HR", IsActive = true };

        context.Departments.AddRange(dept1, dept2);
        await context.SaveChangesAsync();

        var asset1 = new Asset { AssetId = 1, OrgId = 1, AssetName = "Server", DepartmentId = dept1.DepartmentId, Status = Fluxion.Domain.Enums.AssetStatus.assigned };
        var asset2 = new Asset { AssetId = 2, OrgId = 1, AssetName = "Laptop", DepartmentId = dept2.DepartmentId, Status = Fluxion.Domain.Enums.AssetStatus.assigned };

        context.Assets.AddRange(asset1, asset2);
        await context.SaveChangesAsync();
        
        var user1 = new User { UserId = 1, OrgId = 1, FullName = "Tech One", Email = "tech1@example.com" };
        var user2 = new User { UserId = 2, OrgId = 1, FullName = "Tech Two", Email = "tech2@example.com" };

        context.Users.AddRange(user1, user2);
        await context.SaveChangesAsync();

        var ticket1 = new MaintenanceTicket { TicketId = 1, OrgId = 1, AssetId = asset1.AssetId };
        var ticket2 = new MaintenanceTicket { TicketId = 2, OrgId = 1, AssetId = asset1.AssetId };
        var ticket3 = new MaintenanceTicket { TicketId = 3, OrgId = 1, AssetId = asset2.AssetId };

        context.MaintenanceTickets.AddRange(ticket1, ticket2, ticket3);
        await context.SaveChangesAsync();

        context.MaintenanceLogs.AddRange(
            new MaintenanceLog { LogId = 1, OrgId = 1, TicketId = ticket1.TicketId, AssetId = asset1.AssetId, TechnicianId = user1.UserId, RepairCost = 100, ExternalPartsCost = 50, RepairDate = new System.DateTime(2024, 1, 1) },
            new MaintenanceLog { LogId = 2, OrgId = 1, TicketId = ticket2.TicketId, AssetId = asset1.AssetId, TechnicianId = user2.UserId, RepairCost = 200, ExternalPartsCost = 100, RepairDate = new System.DateTime(2024, 1, 15) },
            new MaintenanceLog { LogId = 3, OrgId = 1, TicketId = ticket3.TicketId, AssetId = asset2.AssetId, TechnicianId = user1.UserId, RepairCost = 150, ExternalPartsCost = 25, RepairDate = new System.DateTime(2024, 2, 10) }
        );

        await context.SaveChangesAsync();

        var query = new GetFinancialInsightsQuery();

        // Act
        var resultObj = await handler.Handle(query, CancellationToken.None);
        var result = resultObj?.Data;

        // Assert
        result.Should().NotBeNull();
        
        var itSpend = result!.SpendByDepartment.FirstOrDefault(d => d.DepartmentName == "IT");
        var hrSpend = result.SpendByDepartment.FirstOrDefault(d => d.DepartmentName == "HR");
        
        itSpend.Should().NotBeNull();
        itSpend!.LaborSpend.Should().Be(300);
        itSpend!.PartsSpend.Should().Be(150);
        itSpend!.MaintenanceSpend.Should().Be(450);
        itSpend!.TotalSpend.Should().Be(450);
        
        hrSpend.Should().NotBeNull();
        hrSpend!.LaborSpend.Should().Be(150);
        hrSpend!.PartsSpend.Should().Be(25);
        hrSpend!.MaintenanceSpend.Should().Be(175);
        hrSpend!.TotalSpend.Should().Be(175);

        var tech1Cost = result.CostPerTechnician.FirstOrDefault(t => t.TechnicianName == "Tech One");
        tech1Cost.Should().NotBeNull();
        tech1Cost!.LaborCost.Should().Be(250);
        tech1Cost!.PartsCost.Should().Be(75);
        tech1Cost!.TotalCost.Should().Be(325);
        
        var asset1Cost = result.CostPerAsset.FirstOrDefault(a => a.AssetName == "Server");
        asset1Cost.Should().NotBeNull();
        asset1Cost!.LaborCost.Should().Be(300);
        asset1Cost!.PartsCost.Should().Be(150);
        asset1Cost!.TotalCost.Should().Be(450);

        result.BudgetComparison.TotalBudget.Should().Be(10000m); // 2 depts * 5000
        result.BudgetComparison.ActualSpend.Should().Be(625m); // 450 + 175
        result.BudgetComparison.Variance.Should().Be(9375m); // 10000 - 625
    }
}
