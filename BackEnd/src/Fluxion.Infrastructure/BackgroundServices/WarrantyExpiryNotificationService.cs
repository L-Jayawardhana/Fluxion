using Fluxion.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Fluxion.Infrastructure.BackgroundServices;

public class WarrantyExpiryNotificationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WarrantyExpiryNotificationService> _logger;

    public WarrantyExpiryNotificationService(IServiceProvider serviceProvider, ILogger<WarrantyExpiryNotificationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Warranty Expiry Notification Service starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendWarrantyExpiryEmailsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing warranty expiry check.");
            }

            // Run once a day. Using 24 hours interval for production-like behaviour
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task CheckAndSendWarrantyExpiryEmailsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var today = DateTime.UtcNow.Date;
        var reminderDate = today.AddMonths(1);

        // Find assets where warranty has ended (and not notified), OR exactly 1 month away (and not notified)
        var assetsToProcess = await db.Assets
            .Include(a => a.Assignments)
            .Where(a => a.WarrantyEndDate.HasValue 
                     && (
                         (a.WarrantyEndDate.Value.Date < today && !a.IsWarrantyExpiryNotified) ||
                         (a.WarrantyEndDate.Value.Date == reminderDate && !a.IsWarrantyReminderNotified)
                     ))
            .ToListAsync(cancellationToken);

        if (!assetsToProcess.Any())
        {
            _logger.LogInformation("No new warranty expirations or reminders to notify.");
            return;
        }

        var orgIds = assetsToProcess.Select(a => a.OrgId).Distinct().ToList();
        var owners = await db.Users
            .Where(u => u.OrgId.HasValue && orgIds.Contains(u.OrgId.Value) && (u.Role == Domain.Enums.UserRole.owner || u.Role == Domain.Enums.UserRole.admin))
            .ToListAsync(cancellationToken);

        int sentCount = 0;

        foreach (var asset in assetsToProcess)
        {
            bool isReminder = asset.WarrantyEndDate!.Value.Date == reminderDate;
            bool isExpired = asset.WarrantyEndDate.Value.Date < today;

            var assignment = asset.Assignments?.OrderByDescending(x => x.AssignedDate).FirstOrDefault(x => x.ReturnDate == null);
            var assignee = assignment != null ? await db.Users.FindAsync(new object[] { assignment.UserId }, cancellationToken) : null;
            
            // Collect owner emails for this asset's organization
            var relevantOwners = owners.Where(u => u.OrgId == asset.OrgId && !string.IsNullOrEmpty(u.Email)).ToList();

            string headerText = isReminder ? "Automated Warranty Expiry Reminder (1 Month)" : "Automated Warranty Expiry Notice";
            string introText = isReminder ? "The warranty for the following asset will expire in exactly 1 month:" : "The warranty for the following asset has ended:";
            string subject = isReminder 
                ? $"[Reminder] Warranty Expiring Soon: {asset.AssetName} ({asset.SerialNumber ?? "No SN"})"
                : $"[Automated Notice] Warranty Expired: {asset.AssetName} ({asset.SerialNumber ?? "No SN"})";

            string body = $@"
                <div style=""font-family: sans-serif; max-width: 600px; margin: auto;"">
                    <h2 style=""color: #c84b2f;"">{headerText}</h2>
                    <p>{introText}</p>
                    <div style=""background: #f4f4f4; padding: 15px; border-radius: 8px;"">
                        <ul style=""list-style-type: none; padding: 0; margin: 0;"">
                            <li style=""margin-bottom: 8px;""><strong>Asset Name:</strong> {asset.AssetName}</li>
                            <li style=""margin-bottom: 8px;""><strong>Asset Type:</strong> {asset.AssetType}</li>
                            <li style=""margin-bottom: 8px;""><strong>Serial Number:</strong> {asset.SerialNumber ?? "N/A"}</li>
                            <li style=""margin-bottom: 8px;""><strong>Status:</strong> {asset.Status.ToString().Replace("_", " ")}</li>
                            <li style=""margin-bottom: 8px;""><strong>Warranty End:</strong> {asset.WarrantyEndDate?.ToString("yyyy-MM-dd") ?? "N/A"}</li>
                        </ul>
                    </div>
            ";

            if (assignee != null)
            {
                body += $@"
                    <p style=""margin-top: 20px;"">
                        <strong>Currently Assigned To:</strong><br/>
                        {assignee.FullName} ({assignee.Email})
                    </p>";
            }

            body += @"
                    <hr style=""border: none; border-top: 1px solid #ddd; margin: 25px 0;"" />
                    <p style=""font-size: 12px; color: #888;"">This is an automated message from the Fluxion platform.</p>
                </div>";

            // Send to all owners of that org
            foreach (var owner in relevantOwners)
            {
                await emailService.SendEmailAsync(owner.Email, subject, body);
            }
            
            // Also notify the assignee if they are different from owners
            if (assignee != null && !string.IsNullOrEmpty(assignee.Email) && !relevantOwners.Any(o => o.Email == assignee.Email))
            {
                await emailService.SendEmailAsync(assignee.Email, subject, body);
            }

            if (isReminder)
            {
                asset.IsWarrantyReminderNotified = true;
            }
            if (isExpired)
            {
                asset.IsWarrantyExpiryNotified = true;
            }
            
            sentCount++;
        }

        await db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation($"Processed auto-notifications for {sentCount} warranties (including 1-month reminders).");
    }
}
