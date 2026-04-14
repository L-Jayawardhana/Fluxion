using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Persistence.Context;

public class FluxionDbContext : DbContext, IApplicationDbContext
{
    public FluxionDbContext(DbContextOptions<FluxionDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<OrgSubscription> OrgSubscriptions => Set<OrgSubscription>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<UserDepartment> UserDepartments => Set<UserDepartment>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AssetAssignment> AssetAssignments => Set<AssetAssignment>();
    public DbSet<MaintenanceTicket> MaintenanceTickets => Set<MaintenanceTicket>();
    public DbSet<MaintenanceLog> MaintenanceLogs => Set<MaintenanceLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MaintenanceSchedule> MaintenanceSchedules => Set<MaintenanceSchedule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FluxionDbContext).Assembly);
    }
}
