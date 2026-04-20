using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.UnitTests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Fluxion.UnitTests.Controllers;

public class NotificationControllerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;

    public NotificationControllerTests()
    {
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(c => c.UserId).Returns(1);
    }

    [Fact]
    public async Task GetNotifications_ReturnsAllNotifications_WhenUnreadOnlyIsNull()
    {
        // Arrange
        var context = InMemoryDbContextFactory.Create();
        context.Notifications.Add(new Notification { NotificationId = 1, UserId = 1, OrgId = 1, Title = "T1", Message = "M1", IsRead = true });
        context.Notifications.Add(new Notification { NotificationId = 2, UserId = 1, OrgId = 1, Title = "T2", Message = "M2", IsRead = false });
        context.Notifications.Add(new Notification { NotificationId = 3, UserId = 2, OrgId = 1, Title = "T3", Message = "M3", IsRead = false }); // Other user
        await context.SaveChangesAsync();

        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.GetNotifications(page: 1, pageSize: 10, unreadOnly: null) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        
        var value = result!.Value;
        var total = (int)value!.GetType().GetProperty("total")!.GetValue(value, null)!;
        var unreadCount = (int)value.GetType().GetProperty("unreadCount")!.GetValue(value, null)!;
        
        total.Should().Be(2); // 2 notifications for UserId 1
        unreadCount.Should().Be(1);
    }

    [Fact]
    public async Task GetNotifications_ReturnsUnreadNotifications_WhenUnreadOnlyIsTrue()
    {
        // Arrange
        var context = InMemoryDbContextFactory.Create();
        context.Notifications.Add(new Notification { NotificationId = 1, UserId = 1, OrgId = 1, Title = "T1", Message = "M1", IsRead = true });
        context.Notifications.Add(new Notification { NotificationId = 2, UserId = 1, OrgId = 1, Title = "T2", Message = "M2", IsRead = false });
        await context.SaveChangesAsync();

        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.GetNotifications(page: 1, pageSize: 10, unreadOnly: true) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        
        var value = result!.Value;
        var total = (int)value!.GetType().GetProperty("total")!.GetValue(value, null)!;
        
        total.Should().Be(1); // Only the unread one
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsExpectedUnreadCount()
    {
        // Arrange
        var context = InMemoryDbContextFactory.Create();
        context.Notifications.Add(new Notification { NotificationId = 1, UserId = 1, OrgId = 1, Title = "T1", Message = "M1", IsRead = false });
        context.Notifications.Add(new Notification { NotificationId = 2, UserId = 1, OrgId = 1, Title = "T2", Message = "M2", IsRead = false });
        context.Notifications.Add(new Notification { NotificationId = 3, UserId = 1, OrgId = 1, Title = "T3", Message = "M3", IsRead = true });
        await context.SaveChangesAsync();

        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.GetUnreadCount(CancellationToken.None) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        
        var value = result!.Value;
        var unreadCount = (int)value!.GetType().GetProperty("unreadCount")!.GetValue(value, null)!;
        
        unreadCount.Should().Be(2);
    }

    [Fact]
    public async Task MarkAsRead_MarksCorrectNotificationAsRead_WhenFound()
    {
         // Arrange
        var context = InMemoryDbContextFactory.Create();
        context.Notifications.Add(new Notification { NotificationId = 1, UserId = 1, OrgId = 1, Title = "T1", Message = "M1", IsRead = false });
        await context.SaveChangesAsync();

        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.MarkAsRead(1, CancellationToken.None) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var updatedNotification = await context.Notifications.FindAsync(1);
        updatedNotification!.IsRead.Should().BeTrue();
    }
    
    [Fact]
    public async Task MarkAsRead_ReturnsNotFound_WhenNotificationDoesNotExist()
    {
        // Arrange
        var context = InMemoryDbContextFactory.Create();
        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.MarkAsRead(999, CancellationToken.None) as NotFoundObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task MarkAllAsRead_MarksAllUnreadNotificationsAsReadForUser()
    {
        // Arrange
        var context = InMemoryDbContextFactory.Create();
        context.Notifications.Add(new Notification { NotificationId = 1, UserId = 1, OrgId = 1, Title = "T1", Message = "M1", IsRead = false });
        context.Notifications.Add(new Notification { NotificationId = 2, UserId = 1, OrgId = 1, Title = "T2", Message = "M2", IsRead = false });
        context.Notifications.Add(new Notification { NotificationId = 3, UserId = 2, OrgId = 1, Title = "T3", Message = "M3", IsRead = false });
        await context.SaveChangesAsync();

        var controller = new NotificationController(context, _currentUserServiceMock.Object);

        // Act
        var result = await controller.MarkAllAsRead(CancellationToken.None) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        
        // Ensure user 1's notifications are read
        var n1 = await context.Notifications.FindAsync(1);
        var n2 = await context.Notifications.FindAsync(2);
        n1!.IsRead.Should().BeTrue();
        n2!.IsRead.Should().BeTrue();
        
        // Ensure user 2's notification is untouched
        var n3 = await context.Notifications.FindAsync(3);
        n3!.IsRead.Should().BeFalse();
    }
}
