namespace Fluxion.Application.Interfaces;

/// <summary>
/// Service responsible for sending alert notification emails
/// related to assets and maintenance tickets.
/// </summary>
public interface ITicketAlertEmailService
{
    Task SendAssetAssignedEmailAsync(
        string toEmail,
        string assigneeName,
        string assignedByName,
        string assetName,
        string assetType,
        string? serialNumber,
        DateTime assignedDate);

    Task SendTicketStatusUpdatedEmailAsync(
        string toEmail,
        string recipientName,
        int ticketId,
        string ticketTitle,
        string oldStatus,
        string newStatus,
        string technicianName,
        string assetName);

    Task SendAssetConditionUpdatedEmailAsync(
        string toEmail,
        string recipientName,
        string assetName,
        string assetType,
        string? serialNumber,
        string oldCondition,
        string newCondition,
        string technicianName);
}
