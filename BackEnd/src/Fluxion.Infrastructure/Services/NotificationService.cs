using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Fluxion.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IApplicationDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CreateNotificationAsync(
        int orgId,
        int userId,
        string type,
        string title,
        string message,
        int? ticketId = null,
        int? assetId = null,
        CancellationToken ct = default)
    {
        try
        {
            var notification = new Notification
            {
                OrgId = orgId,
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                TicketId = ticketId,
                AssetId = assetId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Notification created: Type={Type}, UserId={UserId}, Title={Title}",
                type, userId, title);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to create notification: Type={Type}, UserId={UserId}",
                type, userId);
        }
    }
}
