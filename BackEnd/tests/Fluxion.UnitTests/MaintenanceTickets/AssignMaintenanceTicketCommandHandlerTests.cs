using FluentAssertions;
using Fluxion.Application.Features.MaintenanceTickets;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Fluxion.UnitTests.MaintenanceTickets;

public class AssignMaintenanceTicketCommandHandlerTests
{
    private readonly DbContextOptions<Fluxion.Persistence.Context.FluxionDbContext> _options;

    public AssignMaintenanceTicketCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<Fluxion.Persistence.Context.FluxionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private Fluxion.Persistence.Context.FluxionDbContext CreateContext()
    {
        return new Fluxion.Persistence.Context.FluxionDbContext(_options);
    }

    [Fact]
    public async Task Handle_GivenValidRequest_ShouldAssignTicketAndTriggerNotifications()
    {
        // Arrange
        using var context = CreateContext();

        var reporter = new User { UserId = 10, OrgId = 1, FullName = "Reporter Bob", Email = "bob@example.com", Role = UserRole.user };
        var technician = new User { UserId = 20, OrgId = 1, FullName = "Tech Alice", Email = "alice@example.com", Role = UserRole.technician };
        
        var asset = new Asset { AssetId = 1, OrgId = 1, AssetType = "Laptop", AssetName = "Laptop X", Status = AssetStatus.under_maintenance };
        
        var ticket = new MaintenanceTicket 
        { 
            TicketId = 100, OrgId = 1, AssetId = 1,
            Title = "Broken Screen", RaisedBy = 10, 
            Status = TicketStatus.open
        };

        context.Users.AddRange(reporter, technician);
        context.Assets.Add(asset);
        context.MaintenanceTickets.Add(ticket);
        await context.SaveChangesAsync();

        var mockNotificationService = new Mock<INotificationService>();
        var mockEmailService = new Mock<ITicketAlertEmailService>();
        var mockLogger = new Mock<ILogger<AssignMaintenanceTicketCommandHandler>>();

        var handler = new AssignMaintenanceTicketCommandHandler(
            context, 
            mockEmailService.Object, 
            mockNotificationService.Object, 
            mockLogger.Object);

        var command = new AssignMaintenanceTicketCommand(100, 20);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        var dbTicket = await context.MaintenanceTickets.FindAsync(100);
        dbTicket.Should().NotBeNull();
        dbTicket!.AssignedTo.Should().Be(20);
        dbTicket.Status.Should().Be(TicketStatus.assigned);
        
        // Wait briefly for background thread (Task.Run) in the handler email dispatch to execute
        await Task.Delay(200);

        mockNotificationService.Verify(n => n.CreateNotificationAsync(
            1, 10, "ticket_status_updated", "Ticket Assigned", 
            It.IsAny<string>(), 100, 1, It.IsAny<CancellationToken>()), Times.Once);

        mockNotificationService.Verify(n => n.CreateNotificationAsync(
            1, 20, "ticket_assigned", "New Ticket Assigned", 
            It.IsAny<string>(), 100, 1, It.IsAny<CancellationToken>()), Times.Once);
            
        mockEmailService.Verify(e => e.SendTicketStatusUpdatedEmailAsync(
            "bob@example.com", "Reporter Bob", 100, "Broken Screen", 
            "open", "assigned", "Tech Alice", "Laptop X"), Times.Once);
    }

    [Fact]
    public async Task Handle_GivenNonTechnician_ShouldThrowInvalidOperationException()
    {
        // Arrange
        using var context = CreateContext();

        var asset = new Asset { AssetId = 1, OrgId = 1, AssetName = "x", AssetType = "y" };
        var nonTechnician = new User { UserId = 20, OrgId = 1, FullName = "Admin Alex", Role = UserRole.admin };
        var ticket = new MaintenanceTicket { TicketId = 100, OrgId = 1, AssetId = 1, Status = TicketStatus.open };

        context.Assets.Add(asset);
        context.Users.Add(nonTechnician);
        context.MaintenanceTickets.Add(ticket);
        await context.SaveChangesAsync();

        var mockNotificationService = new Mock<INotificationService>();
        var mockEmailService = new Mock<ITicketAlertEmailService>();
        var mockLogger = new Mock<ILogger<AssignMaintenanceTicketCommandHandler>>();

        var handler = new AssignMaintenanceTicketCommandHandler(
            context, mockEmailService.Object, mockNotificationService.Object, mockLogger.Object);

        var command = new AssignMaintenanceTicketCommand(100, 20);

        // Act & Assert
        var action = async () => await handler.Handle(command, CancellationToken.None);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User 20 is not a technician.");
    }
}
