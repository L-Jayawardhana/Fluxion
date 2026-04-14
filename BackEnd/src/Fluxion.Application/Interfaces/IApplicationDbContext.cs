using Fluxion.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Organization> Organizations { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<OrgSubscription> OrgSubscriptions { get; }
    DbSet<Department> Departments { get; }
    DbSet<UserDepartment> UserDepartments { get; }
    DbSet<Asset> Assets { get; }
    DbSet<AssetAssignment> AssetAssignments { get; }
    DbSet<MaintenanceTicket> MaintenanceTickets { get; }
    DbSet<MaintenanceLog> MaintenanceLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<MaintenanceSchedule> MaintenanceSchedules { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
