using Fluxion.Domain.Entities;

namespace Fluxion.Application.Interfaces;

public interface INotificationService
{
    Task CreateNotificationAsync(
        int orgId,
        int userId,
        string type,
        string title,
        string message,
        int? ticketId = null,
        int? assetId = null,
        CancellationToken ct = default);
}
