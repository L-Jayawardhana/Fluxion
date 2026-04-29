using Fluxion.Application.Interfaces;
using Fluxion.Infrastructure.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Fluxion.Infrastructure.Services;

/// <summary>
/// Implementation of ITicketAlertEmailService that uses FluxionEmailTemplates
/// for branded HTML emails.
/// </summary>
public class TicketAlertEmailService : ITicketAlertEmailService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<TicketAlertEmailService> _logger;
    private readonly string _frontendUrl;

    public TicketAlertEmailService(IEmailService emailService, ILogger<TicketAlertEmailService> logger, IConfiguration configuration)
    {
        _emailService = emailService;
        _logger = logger;
        _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
    }

    public async Task SendAssetAssignedEmailAsync(
        string toEmail,
        string assigneeName,
        string assignedByName,
        string assetName,
        string assetType,
        string? serialNumber,
        DateTime assignedDate)
    {
        var html = FluxionEmailTemplates.AssetAssigned(
            assigneeName, assignedByName, assetName, assetType, serialNumber, assignedDate, _frontendUrl);

        await _emailService.SendEmailAsync(
            toEmail,
            $"📦 Fluxion — {assetName} has been assigned to you",
            html);
    }

    public async Task SendTicketStatusUpdatedEmailAsync(
        string toEmail,
        string recipientName,
        int ticketId,
        string ticketTitle,
        string oldStatus,
        string newStatus,
        string technicianName,
        string assetName)
    {
        var html = FluxionEmailTemplates.TicketStatusUpdated(
            recipientName, ticketId, ticketTitle, oldStatus, newStatus, technicianName, assetName, _frontendUrl);

        await _emailService.SendEmailAsync(
            toEmail,
            $"🔄 Fluxion — Your ticket \"{ticketTitle}\" status updated",
            html);
    }

    public async Task SendAssetConditionUpdatedEmailAsync(
        string toEmail,
        string recipientName,
        string assetName,
        string assetType,
        string? serialNumber,
        string oldCondition,
        string newCondition,
        string technicianName)
    {
        var html = FluxionEmailTemplates.AssetConditionUpdated(
            recipientName, assetName, assetType, serialNumber, oldCondition, newCondition, technicianName, _frontendUrl);

        await _emailService.SendEmailAsync(
            toEmail,
            $"🛠️ Fluxion — Condition of {assetName} updated",
            html);
    }
}
