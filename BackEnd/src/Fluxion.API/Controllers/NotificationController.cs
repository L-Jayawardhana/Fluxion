using Fluxion.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public NotificationController(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    /// <summary>Gets all notifications for the current user, newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? unreadOnly = null,
        CancellationToken ct = default)
    {
        if (_currentUser.UserId == null)
            return Unauthorized();

        var userId = _currentUser.UserId.Value;

        var query = _db.Notifications
            .Where(n => n.UserId == userId);

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync(ct);
        var unreadCount = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync(ct);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new
            {
                n.NotificationId,
                n.Type,
                n.Title,
                n.Message,
                n.TicketId,
                n.AssetId,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync(ct);

        return Ok(new { total, unreadCount, page, pageSize, items });
    }

    /// <summary>Gets unread notification count for the bell badge.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        if (_currentUser.UserId == null)
            return Unauthorized();

        var count = await _db.Notifications
            .CountAsync(n => n.UserId == _currentUser.UserId.Value && !n.IsRead, ct);

        return Ok(new { unreadCount = count });
    }

    /// <summary>Marks a single notification as read.</summary>
    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct)
    {
        if (_currentUser.UserId == null)
            return Unauthorized();

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == id && n.UserId == _currentUser.UserId.Value, ct);

        if (notification is null)
            return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Notification marked as read." });
    }

    /// <summary>Marks all notifications as read for the current user.</summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        if (_currentUser.UserId == null)
            return Unauthorized();

        var userId = _currentUser.UserId.Value;

        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new { message = $"{unread.Count} notifications marked as read." });
    }
}
