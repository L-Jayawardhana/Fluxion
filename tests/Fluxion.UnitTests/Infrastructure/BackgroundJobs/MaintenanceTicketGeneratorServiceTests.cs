using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Infrastructure.BackgroundJobs;
using Fluxion.Persistence.Context;
using Fluxion.UnitTests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using System.Reflection;
using Xunit;

namespace Fluxion.UnitTests.Infrastructure.BackgroundJobs;

public class MaintenanceTicketGeneratorServiceTests : IDisposable
{
    private readonly FluxionDbContext _dbContext;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<ILogger<MaintenanceTicketGeneratorService>> _loggerMock;
    private readonly MaintenanceTicketGeneratorService _service;

    public MaintenanceTicketGeneratorServiceTests()
    {
        _dbContext = InMemoryDbContextFactory.Create();
        _notificationServiceMock = new Mock<INotificationService>();
        _loggerMock = new Mock<ILogger<MaintenanceTicketGeneratorService>>();

        var serviceProviderMock = new Mock<IServiceProvider>();
        var scopeMock = new Mock<IServiceScope>();
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();

        serviceProviderMock.Setup(sp => sp.GetService(typeof(IServiceScopeFactory)))
            .Returns(scopeFactoryMock.Object);
        scopeFactoryMock.Setup(sf => sf.CreateScope())
            .Returns(scopeMock.Object);

        var scopedServiceProviderMock = new Mock<IServiceProvider>();
        scopedServiceProviderMock.Setup(sp => sp.GetService(typeof(IApplicationDbContext)))
            .Returns(_dbContext);
        scopedServiceProviderMock.Setup(sp => sp.GetService(typeof(INotificationService)))
            .Returns(_notificationServiceMock.Object);

        scopeMock.Setup(s => s.ServiceProvider)
            .Returns(scopedServiceProviderMock.Object);

        _service = new MaintenanceTicketGeneratorService(serviceProviderMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task ProcessUnassignedTicketsReminderAsync_ShouldSendNotification_WhenTicketIsOldAndUnassigned()
    {
        // Arrange
        var orgId = 1;
        var now = DateTime.UtcNow;

        var owner = new User
        {
            UserId = 100,
            OrgId = orgId,
            Role = UserRole.owner,
            Email = "owner@test.com",
            FullName = "Owner",
            PasswordHash = "hash"
        };
        _dbContext.Users.Add(owner);

        var asset = new Asset
        {
            AssetId = 200,
            OrgId = orgId,
            AssetName = "Test Asset",
            AssetType = "Type"
        };
        _dbContext.Assets.Add(asset);

        // 1. Target: Open, unassigned, older than 2 days -> should trigger
        var oldUnassignedTicketId = 301;
        var oldUnassignedTicket = new MaintenanceTicket
        {
            TicketId = oldUnassignedTicketId,
            OrgId = orgId,
            AssetId = asset.AssetId,
            RaisedBy = 10,
            Status = TicketStatus.open,
            AssignedTo = null,
            CreatedAt = now.AddDays(-3),
            Title = "Old Unassigned",
            IssueDescription = "Desc",
            Priority = TicketPriority.medium,
            UpdatedAt = now
        };

        // 2. Open, unassigned, created just now -> shouldn't trigger
        var newUnassignedTicketId = 302;
        var newUnassignedTicket = new MaintenanceTicket
        {
            TicketId = newUnassignedTicketId,
            OrgId = orgId,
            AssetId = asset.AssetId,
            RaisedBy = 10,
            Status = TicketStatus.open,
            AssignedTo = null,
            CreatedAt = now.AddHours(-12),
            Title = "New Unassigned",
            IssueDescription = "Desc",
            Priority = TicketPriority.medium,
            UpdatedAt = now
        };

        // 3. Open, unassigned, older than 2 days BUT already notified -> shouldn't trigger
        var alreadyNotifiedTicketId = 303;
        var alreadyNotifiedTicket = new MaintenanceTicket
        {
            TicketId = alreadyNotifiedTicketId,
            OrgId = orgId,
            AssetId = asset.AssetId,
            RaisedBy = 10,
            Status = TicketStatus.open,
            AssignedTo = null,
            CreatedAt = now.AddDays(-4),
            Title = "Already Notified",
            IssueDescription = "Desc",
            Priority = TicketPriority.medium,
            UpdatedAt = now
        };
        var existingNotification = new Notification
        {
            NotificationId = 401,
            OrgId = orgId,
            UserId = owner.UserId,
            Type = "UNASSIGNED_TICKET_REMINDER",
            TicketId = alreadyNotifiedTicketId,
            Title = "Unused",
            Message = "Unused",
            CreatedAt = now.AddDays(-1),
            UpdatedAt = now
        };

        // 4. Old and Assigned -> shouldn't trigger
        var oldAssignedTicketId = 304;
        var oldAssignedTicket = new MaintenanceTicket
        {
            TicketId = oldAssignedTicketId,
            OrgId = orgId,
            AssetId = asset.AssetId,
            RaisedBy = 10,
            Status = TicketStatus.open,
            AssignedTo = 99, // Assigned
            CreatedAt = now.AddDays(-5),
            Title = "Old Assigned",
            IssueDescription = "Desc",
            Priority = TicketPriority.medium,
            UpdatedAt = now
        };

        _dbContext.MaintenanceTickets.AddRange(oldUnassignedTicket, newUnassignedTicket, alreadyNotifiedTicket, oldAssignedTicket);
        _dbContext.Notifications.Add(existingNotification);
        await _dbContext.SaveChangesAsync(CancellationToken.None);

        // Act - Invoke private method using Reflection
        var method = typeof(MaintenanceTicketGeneratorService).GetMethod("ProcessUnassignedTicketsReminderAsync", BindingFlags.NonPublic | BindingFlags.Instance);
        if (method == null) throw new InvalidOperationException("ProcessUnassignedTicketsReminderAsync method not found");

        var task = (Task)method.Invoke(_service, new object[] { CancellationToken.None })!;
        await task;

        // Assert
        _notificationServiceMock.Verify(ns => ns.CreateNotificationAsync(
            orgId,
            owner.UserId,
            "UNASSIGNED_TICKET_REMINDER",
            It.IsAny<string>(),
            It.IsAny<string>(),
            oldUnassignedTicketId,
            oldUnassignedTicket.AssetId,
            CancellationToken.None
        ), Times.Once, "Should notify for the old, unassigned ticket");

        _notificationServiceMock.Verify(ns => ns.CreateNotificationAsync(
            It.IsAny<int>(),
            It.IsAny<int>(),
            "UNASSIGNED_TICKET_REMINDER",
            It.IsAny<string>(),
            It.IsAny<string>(),
            newUnassignedTicketId,
            It.IsAny<int?>(),
            It.IsAny<CancellationToken>()
        ), Times.Never, "Should not notify for recently created tickets");

        _notificationServiceMock.Verify(ns => ns.CreateNotificationAsync(
            It.IsAny<int>(),
            It.IsAny<int>(),
            "UNASSIGNED_TICKET_REMINDER",
            It.IsAny<string>(),
            It.IsAny<string>(),
            alreadyNotifiedTicketId,
            It.IsAny<int?>(),
            It.IsAny<CancellationToken>()
        ), Times.Never, "Should not notify if a reminder was already sent");

        _notificationServiceMock.Verify(ns => ns.CreateNotificationAsync(
            It.IsAny<int>(),
            It.IsAny<int>(),
            "UNASSIGNED_TICKET_REMINDER",
            It.IsAny<string>(),
            It.IsAny<string>(),
            oldAssignedTicketId,
            It.IsAny<int?>(),
            It.IsAny<CancellationToken>()
        ), Times.Never, "Should not notify if a ticket is already assigned");
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
