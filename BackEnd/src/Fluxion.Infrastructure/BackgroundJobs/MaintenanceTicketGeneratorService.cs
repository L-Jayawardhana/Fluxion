using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Fluxion.Infrastructure.BackgroundJobs;

public class MaintenanceTicketGeneratorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MaintenanceTicketGeneratorService> _logger;

    public MaintenanceTicketGeneratorService(
        IServiceProvider serviceProvider,
        ILogger<MaintenanceTicketGeneratorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("MaintenanceTicketGeneratorService is running.");
            try
            {
                await ProcessSchedulesAsync(stoppingToken);
                await ProcessUnassignedTicketsReminderAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing MaintenanceTicketGeneratorService.");
            }

            // Run once a day (or frequently in test env, using 12h as per prod standard)
            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }

    private async Task ProcessSchedulesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;

        var dueSchedules = await context.MaintenanceSchedules
            .Where(s => s.IsActive && s.NextDueDate <= now)
            .ToListAsync(cancellationToken);

        foreach (var schedule in dueSchedules)
        {
            if (schedule.AssetId == null)
                continue;

            var ticket = new MaintenanceTicket
            {
                OrgId = schedule.OrgId,
                AssetId = schedule.AssetId.Value,
                RaisedBy = schedule.CreatedByManagerId,
                AssignedTo = schedule.AssignedTechnicianId,
                Title = schedule.Title,
                IssueDescription = schedule.TaskDescription,
                Priority = Fluxion.Domain.Enums.TicketPriority.medium,
                Status = Fluxion.Domain.Enums.TicketStatus.open,
                CreatedAt = now,
                UpdatedAt = now
            };

            context.MaintenanceTickets.Add(ticket);

            schedule.NextDueDate = now.AddDays(schedule.IntervalDays);
            schedule.UpdatedAt = now;
        }

        if (dueSchedules.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Generated {Count} maintenance tickets.", dueSchedules.Count);

            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            // For each schedule processed, notify its organization's owners/admins
            foreach (var schedule in dueSchedules)
            {
                if (schedule.AssetId == null) continue;

                var ownerIds = await context.Users
                    .Where(u => u.OrgId == schedule.OrgId && 
                               (u.Role == Fluxion.Domain.Enums.UserRole.owner ||
                                u.Role == Fluxion.Domain.Enums.UserRole.admin ||
                                u.Role == Fluxion.Domain.Enums.UserRole.manager))
                    .Select(u => u.UserId)
                    .ToListAsync(cancellationToken);

                foreach (var ownerId in ownerIds)
                {
                    await notificationService.CreateNotificationAsync(
                        orgId: schedule.OrgId,
                        userId: ownerId,
                        type: "TICKET_CREATED",
                        title: "Auto-Generated Maintenance Ticket",
                        message: $"An automated maintenance ticket '{schedule.Title}' was raised.",
                        ticketId: null, // Since we don't have the newly generated TicketId mapped back perfectly in scope easily, we map Asset explicitly
                        assetId: schedule.AssetId.Value,
                        ct: cancellationToken
                    );
                }
            }
        }
    }

    private async Task ProcessUnassignedTicketsReminderAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var now = DateTime.UtcNow;
        var thresholdDate = now.AddDays(-2);

        var unassignedTickets = await context.MaintenanceTickets
            .Where(t => t.AssignedTo == null 
                     && t.CreatedAt <= thresholdDate 
                     && t.Status == Fluxion.Domain.Enums.TicketStatus.open 
                     // We check if a reminder notification was already sent to avoid spam
                     && !context.Notifications.Any(n => n.TicketId == t.TicketId && n.Type == "UNASSIGNED_TICKET_REMINDER"))
            .ToListAsync(cancellationToken);

        if (!unassignedTickets.Any()) return;

        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        foreach (var ticket in unassignedTickets)
        {
            var ownerIds = await context.Users
                .Where(u => u.OrgId == ticket.OrgId && 
                           (u.Role == Fluxion.Domain.Enums.UserRole.owner || 
                            u.Role == Fluxion.Domain.Enums.UserRole.admin ||
                            u.Role == Fluxion.Domain.Enums.UserRole.manager))
                .Select(u => u.UserId)
                .ToListAsync(cancellationToken);

            foreach (var ownerId in ownerIds)
            {
                await notificationService.CreateNotificationAsync(
                    orgId: ticket.OrgId,
                    userId: ownerId,
                    type: "UNASSIGNED_TICKET_REMINDER",
                    title: "Unassigned Ticket Reminder",
                    message: $"Ticket '{ticket.Title}' was raised more than two days ago and is still unassigned.",
                    ticketId: ticket.TicketId,
                    assetId: ticket.AssetId,
                    ct: cancellationToken
                );
            }
        }
        _logger.LogInformation("Sent unassigned specific reminders for {Count} tickets.", unassignedTickets.Count);
    }
}