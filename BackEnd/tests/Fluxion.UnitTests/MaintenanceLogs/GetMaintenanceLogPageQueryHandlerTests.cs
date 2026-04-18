using FluentAssertions;
using Fluxion.Application.Features.MaintenanceLogs;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Persistence.Context;
using Fluxion.UnitTests.Helpers;

namespace Fluxion.UnitTests.MaintenanceLogs;

public class GetMaintenanceLogPageQueryHandlerTests
{
    private sealed class FakeCurrentUserService : ICurrentUserService
    {
        public int? UserId { get; set; }
        public string? Role { get; set; }
    }

    private static FluxionDbContext CreateDb() => InMemoryDbContextFactory.Create();

    [Fact]
    public async Task Technician_WithRepairLogButNoAssignedTicket_CanViewAssetMaintenanceLog()
    {
        using var db = CreateDb();
        const int orgId = 1;
        const int techId = 800;

        db.Organizations.Add(new Organization
        {
            OrgId = orgId,
            OrgName = "Org-1",
            Slug = "org-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Users.AddRange(
            new User
            {
                UserId = techId,
                OrgId = orgId,
                FullName = "Tech User",
                Email = "tech@example.com",
                PasswordHash = "hash",
                Role = UserRole.technician,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                UserId = 801,
                OrgId = orgId,
                FullName = "Other Tech",
                Email = "other-tech@example.com",
                PasswordHash = "hash",
                Role = UserRole.technician,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

        db.Assets.Add(new Asset
        {
            AssetId = 100,
            OrgId = orgId,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.under_maintenance,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 200,
            OrgId = orgId,
            AssetId = 100,
            RaisedBy = 1,
            AssignedTo = 801,
            Title = "Fan issue",
            IssueDescription = "Cooling fan noisy",
            Priority = TicketPriority.medium,
            Status = TicketStatus.in_progress,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        });

        db.MaintenanceLogs.Add(new MaintenanceLog
        {
            LogId = 300,
            OrgId = orgId,
            TicketId = 200,
            AssetId = 100,
            TechnicianId = techId,
            RepairDate = DateTime.UtcNow,
            RepairCost = 150m,
            RepairNotes = "Replaced fan",
            IsVisibleToEmployee = null
        });

        await db.SaveChangesAsync();

        var handler = new GetMaintenanceLogPageQueryHandler(
            db,
            new FakeCurrentUserService { UserId = techId, Role = "technician" });

        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 100, PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.TotalCount.Should().Be(1);
        result.Data.MaintenanceLogs.Items.Should().ContainSingle(i => i.TicketId == 200);
    }

    [Fact]
    public async Task Technician_MaintenanceLogPage_IncludesTicketEvenWithoutRepairLogEntry()
    {
        using var db = CreateDb();
        const int orgId = 2;
        const int techId = 810;

        db.Organizations.Add(new Organization
        {
            OrgId = orgId,
            OrgName = "Org-2",
            Slug = "org-2",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Users.Add(new User
        {
            UserId = techId,
            OrgId = orgId,
            FullName = "Tech Viewer",
            Email = "viewer@example.com",
            PasswordHash = "hash",
            Role = UserRole.technician,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Assets.Add(new Asset
        {
            AssetId = 110,
            OrgId = orgId,
            AssetName = "Asset B",
            AssetType = "Printer",
            Status = AssetStatus.assigned,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 210,
            OrgId = orgId,
            AssetId = 110,
            RaisedBy = 1,
            AssignedTo = techId,
            Title = "Paper jam",
            IssueDescription = "Tray 2 jammed repeatedly",
            Priority = TicketPriority.low,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();

        var handler = new GetMaintenanceLogPageQueryHandler(
            db,
            new FakeCurrentUserService { UserId = techId, Role = "technician" });

        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 110, PageNumber = 1, PageSize = 10 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.TotalCount.Should().Be(1);

        var item = result.Data.MaintenanceLogs.Items.Should().ContainSingle().Subject;
        item.TicketId.Should().Be(210);
        item.LogId.Should().Be(210);
        item.RepairDescription.Should().Be("Tray 2 jammed repeatedly");
        item.Cost.Should().BeNull();
    }
}
