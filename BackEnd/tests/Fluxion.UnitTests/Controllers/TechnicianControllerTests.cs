using System.Text.Json;
using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Persistence.Context;
using Fluxion.UnitTests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace Fluxion.UnitTests.Controllers;

public class TechnicianControllerTests
{
    private sealed class FakeCurrentUserService : ICurrentUserService
    {
        public int? UserId { get; set; }
        public string? Role { get; set; }
    }

    private static FluxionDbContext CreateDb() => InMemoryDbContextFactory.Create();

    private static async Task SeedBaseAsync(FluxionDbContext db, int orgId, int assetId)
    {
        db.Organizations.Add(new Organization
        {
            OrgId = orgId,
            OrgName = $"Org-{orgId}",
            Slug = $"org-{orgId}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Assets.Add(new Asset
        {
            AssetId = assetId,
            OrgId = orgId,
            AssetName = "Laptop-Pro",
            AssetType = "Laptop",
            Status = AssetStatus.assigned,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetDashboardStats_ReturnsCalculatedCounts()
    {
        using var db = CreateDb();
        const int techId = 700;

        await SeedBaseAsync(db, orgId: 1, assetId: 11);

        db.MaintenanceTickets.AddRange(
            new MaintenanceTicket { TicketId = 1, OrgId = 1, AssetId = 11, RaisedBy = 9, AssignedTo = techId, Title = "t1", IssueDescription = "d", Priority = TicketPriority.low, Status = TicketStatus.open, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new MaintenanceTicket { TicketId = 2, OrgId = 1, AssetId = 11, RaisedBy = 9, AssignedTo = techId, Title = "t2", IssueDescription = "d", Priority = TicketPriority.medium, Status = TicketStatus.in_progress, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new MaintenanceTicket { TicketId = 3, OrgId = 1, AssetId = 11, RaisedBy = 9, AssignedTo = techId, Title = "t3", IssueDescription = "d", Priority = TicketPriority.critical, Status = TicketStatus.closed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = techId, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.GetDashboardStats(CancellationToken.None);

        var ok = action.Should().BeOfType<OkObjectResult>().Subject;
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
        doc.RootElement.GetProperty("totalAssigned").GetInt32().Should().Be(3);
        doc.RootElement.GetProperty("openTickets").GetInt32().Should().Be(1);
        doc.RootElement.GetProperty("inProgress").GetInt32().Should().Be(1);
        doc.RootElement.GetProperty("resolved").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task UpdateStatus_InvalidStatus_ReturnsBadRequest()
    {
        using var db = CreateDb();
        const int techId = 701;

        await SeedBaseAsync(db, orgId: 1, assetId: 12);
        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 20,
            OrgId = 1,
            AssetId = 12,
            RaisedBy = 9,
            AssignedTo = techId,
            Title = "Status test",
            IssueDescription = "desc",
            Priority = TicketPriority.high,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = techId, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.UpdateStatus(20, new UpdateStatusRequest("not_a_real_status"), CancellationToken.None);

        action.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task LogRepair_WhenTicketNotInProgress_ReturnsBadRequest()
    {
        using var db = CreateDb();
        const int techId = 702;

        await SeedBaseAsync(db, orgId: 2, assetId: 21);
        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 30,
            OrgId = 2,
            AssetId = 21,
            RaisedBy = 10,
            AssignedTo = techId,
            Title = "Repair test",
            IssueDescription = "desc",
            Priority = TicketPriority.medium,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = techId, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.LogRepair(30, new LogRepairRequest("replaced part", 120m, 30m), CancellationToken.None);

        action.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task LogRepair_WhenTicketAssigned_SavesRepairDetailsIncludingPartsCost_ReturnsOk()
    {
        using var db = CreateDb();
        const int techId = 703;

        await SeedBaseAsync(db, orgId: 2, assetId: 22);
        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 31,
            OrgId = 2,
            AssetId = 22,
            RaisedBy = 10,
            AssignedTo = techId,
            Title = "Repair test details",
            IssueDescription = "desc details",
            Priority = TicketPriority.medium,
            Status = TicketStatus.assigned,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = techId, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.LogRepair(31, new LogRepairRequest("replaced parts successfully", 120m, 50m), CancellationToken.None);

        var okResult = action.Should().BeOfType<OkObjectResult>().Subject;
        var responseValue = okResult.Value;

        responseValue.Should().NotBeNull();
        
        var jsonText = JsonSerializer.Serialize(responseValue);
        var jsonDoc = JsonDocument.Parse(jsonText);
        
        jsonDoc.RootElement.GetProperty("message").GetString().Should().Be("Repair log saved.");
        jsonDoc.RootElement.GetProperty("laborCost").GetDecimal().Should().Be(120m);
        jsonDoc.RootElement.GetProperty("externalPartsCost").GetDecimal().Should().Be(50m);
        jsonDoc.RootElement.GetProperty("totalMaintenanceCost").GetDecimal().Should().Be(170m);

        var ticket = db.MaintenanceTickets.Find(31);
        ticket.Should().NotBeNull();
        ticket!.Status.Should().Be(TicketStatus.in_progress);
        
        var log = db.MaintenanceLogs.FirstOrDefault(l => l.TicketId == 31);
        log.Should().NotBeNull();
        log!.RepairCost.Should().Be(120m);
        log.ExternalPartsCost.Should().Be(50m);
        log.RepairNotes.Should().Be("replaced parts successfully");
    }

    [Fact]
    public async Task AddComment_NotAssignedTicket_ReturnsNotFound()
    {
        using var db = CreateDb();

        await SeedBaseAsync(db, orgId: 3, assetId: 31);
        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 40,
            OrgId = 3,
            AssetId = 31,
            RaisedBy = 12,
            AssignedTo = 999,
            Title = "Comment test",
            IssueDescription = "desc",
            Priority = TicketPriority.low,
            Status = TicketStatus.in_progress,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = 703, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.AddComment(40, new AddCommentRequest("working on it"), CancellationToken.None);

        action.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetTechnicianAssets_ReturnsDistinctAssetsFromTicketsAndRepairLogs()
    {
        using var db = CreateDb();
        const int techId = 710;

        db.Organizations.Add(new Organization
        {
            OrgId = 10,
            OrgName = "Org-10",
            Slug = "org-10",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.Assets.AddRange(
            new Asset
            {
                AssetId = 51,
                OrgId = 10,
                AssetName = "Asset-A",
                AssetType = "Laptop",
                SerialNumber = "SN-51",
                Status = AssetStatus.assigned,
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Asset
            {
                AssetId = 52,
                OrgId = 10,
                AssetName = "Asset-B",
                AssetType = "Printer",
                SerialNumber = "SN-52",
                Status = AssetStatus.under_maintenance,
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

        db.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 501,
            OrgId = 10,
            AssetId = 51,
            RaisedBy = 1,
            AssignedTo = techId,
            Title = "Assigned ticket",
            IssueDescription = "desc",
            Priority = TicketPriority.low,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        db.MaintenanceLogs.AddRange(
            new MaintenanceLog
            {
                LogId = 601,
                OrgId = 10,
                TicketId = 501,
                AssetId = 51,
                TechnicianId = techId,
                RepairDate = DateTime.UtcNow,
                RepairNotes = "note",
                IsVisibleToEmployee = null
            },
            new MaintenanceLog
            {
                LogId = 602,
                OrgId = 10,
                TicketId = 501,
                AssetId = 52,
                TechnicianId = techId,
                RepairDate = DateTime.UtcNow,
                RepairNotes = "another note",
                IsVisibleToEmployee = null
            });

        await db.SaveChangesAsync();

        var controller = new TechnicianController(
            db,
            new FakeCurrentUserService { UserId = techId, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.GetTechnicianAssets(CancellationToken.None);

        var ok = action.Should().BeOfType<OkObjectResult>().Subject;
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));

        doc.RootElement.GetArrayLength().Should().Be(2);

        var assetIds = doc.RootElement
            .EnumerateArray()
            .Select(x => x.GetProperty("assetId").GetInt32())
            .OrderBy(x => x)
            .ToArray();

        assetIds.Should().Equal(51, 52);
    }

    [Fact]
    public async Task UpdateAssetCondition_InvalidCondition_ReturnsBadRequest()
    {
        using var db = CreateDb();

        await SeedBaseAsync(db, orgId: 4, assetId: 41);
        var controller = new TechnicianController(
            db, 
            new FakeCurrentUserService { UserId = 704, Role = "technician" },
            new Mock<ITicketAlertEmailService>().Object,
            new Mock<INotificationService>().Object,
            new Mock<ILogger<TechnicianController>>().Object);

        var action = await controller.UpdateAssetCondition(41, new UpdateConditionRequest("broken_forever"), CancellationToken.None);

        action.Should().BeOfType<BadRequestObjectResult>();
    }
}
