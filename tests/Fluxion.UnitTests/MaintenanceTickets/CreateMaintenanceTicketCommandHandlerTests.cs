using FluentAssertions;
using Fluxion.Application.Features.MaintenanceTickets;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Fluxion.UnitTests.MaintenanceTickets;

public class CreateMaintenanceTicketCommandHandlerTests
{
    private readonly DbContextOptions<Fluxion.Persistence.Context.FluxionDbContext> _options;

    public CreateMaintenanceTicketCommandHandlerTests()
    {
        // Use an unique in-memory database name for each test class
        _options = new DbContextOptionsBuilder<Fluxion.Persistence.Context.FluxionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private Fluxion.Persistence.Context.FluxionDbContext CreateContext()
    {
        return new Fluxion.Persistence.Context.FluxionDbContext(_options);
    }

    [Fact]
    public async Task Handle_GivenValidRequest_ShouldCreateTicketAndUpdateAssetStatus()
    {
        // Arrange
        using var context = CreateContext();
        
        var org = new Organization { OrgId = 1, OrgName = "Test Org", Slug = "test" };
        var asset = new Asset 
        { 
            AssetId = 1, OrgId = 1, AssetType = "Laptop", AssetName = "Laptop X", 
            Status = AssetStatus.available 
        };
        
        context.Organizations.Add(org);
        context.Assets.Add(asset);
        await context.SaveChangesAsync();

        var handler = new CreateMaintenanceTicketCommandHandler(context);
        var command = new CreateMaintenanceTicketCommand(1, 1, 10, "Title", "Broken Screen", TicketPriority.high);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TicketId.Should().BeGreaterThan(0);

        var dbTicket = await context.MaintenanceTickets.FindAsync(result.TicketId);
        dbTicket.Should().NotBeNull();
        dbTicket!.Title.Should().Be("Title");
        dbTicket.Status.Should().Be(TicketStatus.open);
        dbTicket.Priority.Should().Be(TicketPriority.high);
        
        var dbAsset = await context.Assets.FindAsync(1);
        dbAsset!.Status.Should().Be(AssetStatus.under_maintenance);
    }

    [Fact]
    public async Task Handle_GivenNonExistentAsset_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        using var context = CreateContext();
        var handler = new CreateMaintenanceTicketCommandHandler(context);
        var command = new CreateMaintenanceTicketCommand(999, 1, 10, "Title", "Desc", TicketPriority.low);

        // Act & Assert
        var action = async () => await handler.Handle(command, CancellationToken.None);
        await action.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("Asset ID 999 not found in this organization.");
    }
}
