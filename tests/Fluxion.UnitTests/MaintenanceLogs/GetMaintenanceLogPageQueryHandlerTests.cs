using FluentAssertions;
using FluentValidation;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Features.MaintenanceLogs;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.UnitTests.Helpers;
using Moq;
using Xunit;

namespace Fluxion.UnitTests.MaintenanceLogs;

public class GetMaintenanceLogPageQueryHandlerTests
{
    private static Fluxion.Persistence.Context.FluxionDbContext CreateContext()
    {
        return InMemoryDbContextFactory.Create();
    }

    private static GetMaintenanceLogPageQueryHandler CreateHandler(
        Fluxion.Persistence.Context.FluxionDbContext context,
        string role,
        int userId)
    {
        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(u => u.Role).Returns(role);
        mockUserService.Setup(u => u.UserId).Returns(userId);

        return new GetMaintenanceLogPageQueryHandler(context, mockUserService.Object);
    }

    [Fact]
    public async Task Owner_ReturnsLogsCommentsAndSummaryStats()
    {
        using var context = CreateContext();

        var asset = new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var ticket = new MaintenanceTicket
        {
            TicketId = 10,
            OrgId = 1,
            AssetId = 1,
            RaisedBy = 2,
            Title = "Fix fan",
            IssueDescription = "Noise",
            Priority = TicketPriority.medium,
            Status = TicketStatus.closed,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            ClosedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var tech = new User
        {
            UserId = 5,
            OrgId = 1,
            FullName = "Tech One",
            Email = "tech@fluxion.dev",
            PasswordHash = "hash",
            Role = UserRole.technician,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Assets.Add(asset);
        context.MaintenanceTickets.Add(ticket);
        context.Users.Add(tech);
        context.MaintenanceLogs.AddRange(
            new MaintenanceLog
            {
                LogId = 100,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddDays(-1),
                RepairCost = 120,
                RepairNotes = "Replaced fan",
                IsVisibleToEmployee = null
            },
            new MaintenanceLog
            {
                LogId = 101,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-6),
                RepairNotes = "Internal note",
                IsVisibleToEmployee = false
            },
            new MaintenanceLog
            {
                LogId = 102,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-2),
                RepairNotes = "Visible note",
                IsVisibleToEmployee = true
            }
        );
        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "owner", 1);
        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.TotalCount.Should().Be(1);
        result.Data.Comments.Should().HaveCount(2);
        result.Data.SummaryStats.Should().NotBeNull();
        result.Data.SummaryStats!.TotalMaintenanceCount.Should().Be(1);
        result.Data.SummaryStats.TotalCost.Should().Be(120);
        result.Data.SummaryStats.CostPerTechnician.Should().ContainSingle(c => c.TechnicianName == "Tech One");
    }

    [Fact]
    public async Task Technician_ReturnsOwnLogsAndAssignedTicketComments()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.MaintenanceTickets.AddRange(
            new MaintenanceTicket
            {
                TicketId = 10,
                OrgId = 1,
                AssetId = 1,
                AssignedTo = 5,
                RaisedBy = 2,
                Title = "Assigned ticket",
                IssueDescription = "Issue",
                Priority = TicketPriority.low,
                Status = TicketStatus.in_progress,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new MaintenanceTicket
            {
                TicketId = 11,
                OrgId = 1,
                AssetId = 1,
                AssignedTo = 6,
                RaisedBy = 2,
                Title = "Other ticket",
                IssueDescription = "Issue",
                Priority = TicketPriority.low,
                Status = TicketStatus.open,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        );

        context.Users.AddRange(
            new User
            {
                UserId = 5,
                OrgId = 1,
                FullName = "Tech One",
                Email = "tech@fluxion.dev",
                PasswordHash = "hash",
                Role = UserRole.technician,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                UserId = 6,
                OrgId = 1,
                FullName = "Tech Two",
                Email = "tech2@fluxion.dev",
                PasswordHash = "hash",
                Role = UserRole.technician,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        );

        context.MaintenanceLogs.AddRange(
            new MaintenanceLog
            {
                LogId = 100,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-5),
                RepairCost = 50,
                RepairNotes = "Work done",
                IsVisibleToEmployee = null
            },
            new MaintenanceLog
            {
                LogId = 101,
                OrgId = 1,
                TicketId = 11,
                AssetId = 1,
                TechnicianId = 6,
                RepairDate = DateTime.UtcNow.AddHours(-4),
                RepairCost = 75,
                RepairNotes = "Other work",
                IsVisibleToEmployee = null
            },
            new MaintenanceLog
            {
                LogId = 102,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-3),
                RepairNotes = "Visible comment",
                IsVisibleToEmployee = true
            },
            new MaintenanceLog
            {
                LogId = 103,
                OrgId = 1,
                TicketId = 11,
                AssetId = 1,
                TechnicianId = 6,
                RepairDate = DateTime.UtcNow.AddHours(-2),
                RepairNotes = "Other comment",
                IsVisibleToEmployee = true
            }
        );

        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "technician", 5);
        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.Items.Should().ContainSingle(l => l.LogId == 100);
        result.Data.MaintenanceLogs.Items.First().Cost.Should().NotBeNull();
        result.Data.Comments.Should().ContainSingle(c => c.LogId == 102);
    }

    [Fact]
    public async Task Employee_ReturnsPublicCommentsAndNoCost()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.AssetAssignments.Add(new AssetAssignment
        {
            AssignmentId = 1,
            OrgId = 1,
            AssetId = 1,
            UserId = 20,
            AssignedBy = 1,
            AssignedDate = DateTime.UtcNow.AddDays(-10),
            UpdatedAt = DateTime.UtcNow
        });

        context.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 10,
            OrgId = 1,
            AssetId = 1,
            RaisedBy = 2,
            Title = "Assigned ticket",
            IssueDescription = "Issue",
            Priority = TicketPriority.low,
            Status = TicketStatus.closed,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            ClosedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.MaintenanceLogs.AddRange(
            new MaintenanceLog
            {
                LogId = 100,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-5),
                RepairCost = 50,
                RepairNotes = "Work done",
                IsVisibleToEmployee = null
            },
            new MaintenanceLog
            {
                LogId = 101,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-4),
                RepairNotes = "Visible comment",
                IsVisibleToEmployee = true
            },
            new MaintenanceLog
            {
                LogId = 102,
                OrgId = 1,
                TicketId = 10,
                AssetId = 1,
                TechnicianId = 5,
                RepairDate = DateTime.UtcNow.AddHours(-3),
                RepairNotes = "Internal comment",
                IsVisibleToEmployee = false
            }
        );

        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "user", 20);
        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.Items.Should().OnlyContain(l => l.Cost == null);
        result.Data.Comments.Should().ContainSingle(c => c.LogId == 101);
    }

    [Fact]
    public async Task Employee_UnassignedAsset_ThrowsForbidden()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "user", 20);
        var action = async () => await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        await action.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Technician_NoLinkedTicket_ThrowsForbidden()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 10,
            OrgId = 1,
            AssetId = 1,
            AssignedTo = 99,
            RaisedBy = 2,
            Title = "Other ticket",
            IssueDescription = "Issue",
            Priority = TicketPriority.low,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "technician", 5);
        var action = async () => await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        await action.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task EmptyLogs_ReturnsEmptyPagedResult()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "owner", 1);
        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.TotalCount.Should().Be(0);
        result.Data.MaintenanceLogs.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Pagination_WorksCorrectly()
    {
        using var context = CreateContext();

        context.Assets.Add(new Asset
        {
            AssetId = 1,
            OrgId = 1,
            AssetName = "Asset A",
            AssetType = "Laptop",
            Status = AssetStatus.available,
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.MaintenanceTickets.Add(new MaintenanceTicket
        {
            TicketId = 10,
            OrgId = 1,
            AssetId = 1,
            RaisedBy = 2,
            Title = "Ticket",
            IssueDescription = "Issue",
            Priority = TicketPriority.low,
            Status = TicketStatus.open,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        });

        context.MaintenanceLogs.AddRange(
            new MaintenanceLog { LogId = 1, OrgId = 1, TicketId = 10, AssetId = 1, RepairDate = DateTime.UtcNow.AddHours(-3), IsVisibleToEmployee = null },
            new MaintenanceLog { LogId = 2, OrgId = 1, TicketId = 10, AssetId = 1, RepairDate = DateTime.UtcNow.AddHours(-2), IsVisibleToEmployee = null },
            new MaintenanceLog { LogId = 3, OrgId = 1, TicketId = 10, AssetId = 1, RepairDate = DateTime.UtcNow.AddHours(-1), IsVisibleToEmployee = null }
        );

        await context.SaveChangesAsync();

        var handler = CreateHandler(context, "owner", 1);
        var result = await handler.Handle(new GetMaintenanceLogPageQuery { AssetId = 1, PageNumber = 2, PageSize = 2 }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.MaintenanceLogs.TotalCount.Should().Be(3);
        result.Data.MaintenanceLogs.Items.Should().HaveCount(1);
    }

    [Fact]
    public void PageSizeGreaterThan50_ThrowsValidationException()
    {
        var validator = new GetMaintenanceLogPageQueryValidator();
        var action = () => validator.ValidateAndThrow(new GetMaintenanceLogPageQuery { AssetId = 1, PageSize = 60 });

        action.Should().Throw<ValidationException>();
    }
}
