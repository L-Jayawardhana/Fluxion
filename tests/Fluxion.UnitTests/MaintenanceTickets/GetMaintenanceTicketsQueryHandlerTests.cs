using FluentAssertions;
using FluentValidation;
using Fluxion.Application.Features.MaintenanceTickets;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Fluxion.UnitTests.MaintenanceTickets;

public class GetMaintenanceTicketsQueryHandlerTests
{
    private readonly DbContextOptions<Fluxion.Persistence.Context.FluxionDbContext> _options;

    public GetMaintenanceTicketsQueryHandlerTests()
    {
        _options = new DbContextOptionsBuilder<Fluxion.Persistence.Context.FluxionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private Fluxion.Persistence.Context.FluxionDbContext CreateContext()
    {
        return new Fluxion.Persistence.Context.FluxionDbContext(_options);
    }

    private GetMaintenanceTicketsQueryHandler CreateHandler(
        Fluxion.Persistence.Context.FluxionDbContext context,
        string role,
        int userId,
        List<MaintenanceTicket> tickets)
    {
        context.MaintenanceTickets.AddRange(tickets);
        context.SaveChanges();

        var mockRepo = new Mock<IMaintenanceTicketRepository>();
        mockRepo.Setup(r => r.GetTicketsQuery()).Returns(context.MaintenanceTickets);

        var mockUserService = new Mock<ICurrentUserService>();
        mockUserService.Setup(u => u.Role).Returns(role);
        mockUserService.Setup(u => u.UserId).Returns(userId);

        return new GetMaintenanceTicketsQueryHandler(mockRepo.Object, mockUserService.Object, context);
    }

    [Fact]
    public async Task Admin_ReturnsAllTicketsUnscoped()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, Asset = new Asset { AssetName = "A2" } }
        };

        var handler = CreateHandler(context, "admin", 1, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task Employee_ReturnsOnlyTicketsForAssignedAssets()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket 
            { 
                TicketId = 1, 
                Asset = new Asset 
                { 
                    AssetName = "A1", 
                    Assignments = new List<AssetAssignment> 
                    { 
                        new AssetAssignment { UserId = 10, ReturnDate = null } 
                    } 
                } 
            },
            new MaintenanceTicket 
            { 
                TicketId = 2, 
                Asset = new Asset 
                { 
                    AssetName = "A2", 
                    Assignments = new List<AssetAssignment> 
                    { 
                        new AssetAssignment { UserId = 20, ReturnDate = null } 
                    } 
                } 
            }
        };

        var handler = CreateHandler(context, "user", 10, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery(), CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 1);
    }

    [Fact]
    public async Task Technician_ReturnsOnlyAssignedTickets()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, AssignedTo = 30, Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, AssignedTo = 40, Asset = new Asset { AssetName = "A2" } }
        };

        var handler = CreateHandler(context, "technician", 40, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery(), CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 2);
    }

    [Fact]
    public async Task Manager_ReturnsOnlyTicketsWithinDepartment()
    {
        using var context = CreateContext();
        
        // Setup manager user department
        context.UserDepartments.Add(new UserDepartment { UserId = 50, DepartmentId = 5 });
        await context.SaveChangesAsync();

        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, Asset = new Asset { AssetName = "A1", DepartmentId = 5 } },
            new MaintenanceTicket { TicketId = 2, Asset = new Asset { AssetName = "A2", DepartmentId = 99 } }
        };

        var handler = CreateHandler(context, "manager", 50, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery(), CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 1);
    }

    [Fact]
    public async Task FilterByStatus_ReturnsOnlyMatching()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, Status = TicketStatus.open, Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, Status = TicketStatus.closed, Asset = new Asset { AssetName = "A2" } }
        };

        var handler = CreateHandler(context, "admin", 1, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery { Status = TicketStatus.open }, CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 1);
    }

    [Fact]
    public async Task FilterByPriority_ReturnsOnlyMatching()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, Priority = TicketPriority.high, Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, Priority = TicketPriority.low, Asset = new Asset { AssetName = "A2" } }
        };

        var handler = CreateHandler(context, "admin", 1, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery { Priority = TicketPriority.high }, CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 1);
    }

    [Fact]
    public async Task FilterByKeyword_MatchesTitleOrDescription()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, Title = "Broken network", IssueDescription = "fix", Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, Title = "Update OS", IssueDescription = "network issue", Asset = new Asset { AssetName = "A2" } }
        };

        var handler = CreateHandler(context, "admin", 1, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery { Keyword = "NetWork" }, CancellationToken.None);

        result.Data!.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task FilterByDateRange_ReturnsTicketsWithinRange()
    {
        using var context = CreateContext();
        var tickets = new List<MaintenanceTicket>
        {
            new MaintenanceTicket { TicketId = 1, CreatedAt = new DateTime(2025, 1, 10), Asset = new Asset { AssetName = "A1" } },
            new MaintenanceTicket { TicketId = 2, CreatedAt = new DateTime(2025, 1, 15), Asset = new Asset { AssetName = "A2" } },
            new MaintenanceTicket { TicketId = 3, CreatedAt = new DateTime(2025, 1, 20), Asset = new Asset { AssetName = "A3" } }
        };

        var handler = CreateHandler(context, "admin", 1, tickets);
        var result = await handler.Handle(new GetMaintenanceTicketsQuery 
        { 
            DateFrom = new DateTime(2025, 1, 12),
            DateTo = new DateTime(2025, 1, 18)
        }, CancellationToken.None);

        result.Data!.Items.Should().ContainSingle(t => t.TicketId == 2);
    }

    [Fact]
    public async Task NoMatchingTickets_ReturnsEmptyPaginatedResult()
    {
        using var context = CreateContext();
        var handler = CreateHandler(context, "admin", 1, new List<MaintenanceTicket>());
        var result = await handler.Handle(new GetMaintenanceTicketsQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Data!.TotalCount.Should().Be(0);
        result.Data.Items.Should().BeEmpty();
    }

    [Fact]
    public void DateFromAfterDateTo_ThrowsValidationException()
    {
        var query = new GetMaintenanceTicketsQuery 
        { 
            DateFrom = new DateTime(2025, 1, 20),
            DateTo = new DateTime(2025, 1, 10)
        };
        var validator = new GetMaintenanceTicketsQueryValidator();

        var action = () => validator.ValidateAndThrow(query);

        action.Should().Throw<ValidationException>();
    }

    [Fact]
    public void PageSizeGreaterThan50_ThrowsValidationException()
    {
        var query = new GetMaintenanceTicketsQuery { PageSize = 100 };
        var validator = new GetMaintenanceTicketsQueryValidator();

        var action = () => validator.ValidateAndThrow(query);

        action.Should().Throw<ValidationException>();
    }
}
