using FluentAssertions;
using Fluxion.Application.Features.Organizations;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.UnitTests.Organizations;

public class OrganizationPlanHandlerTests : IDisposable
{
    private readonly FluxionDbContext _db;

    public OrganizationPlanHandlerTests()
    {
        var options = new DbContextOptionsBuilder<FluxionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new FluxionDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetOrganizationPlanHandler_NoActivePlan_ReturnsFree()
    {
        var handler = new GetOrganizationPlanHandler(_db);
        var result = await handler.Handle(new GetOrganizationPlanQuery(OrgId: 1), CancellationToken.None);
        
        result.Should().Be("Free");
    }

    [Fact]
    public async Task GetOrganizationPlanHandler_ActivePlanExists_ReturnsPlanName()
    {
        var plan = new SubscriptionPlan { PlanId = 1, PlanName = "Pro", PriceMonthly = 29, IsActive = true };
        _db.SubscriptionPlans.Add(plan);
        _db.OrgSubscriptions.Add(new OrgSubscription 
        { 
            OrgId = 1, PlanId = 1, Status = SubscriptionStatus.active 
        });
        await _db.SaveChangesAsync();

        var handler = new GetOrganizationPlanHandler(_db);
        var result = await handler.Handle(new GetOrganizationPlanQuery(OrgId: 1), CancellationToken.None);

        result.Should().Be("Pro");
    }

    [Fact]
    public async Task UpdateOrganizationPlanHandler_DowngradeViolatesUserLimit_Throws()
    {
        // Add Organization
        _db.Organizations.Add(new Organization { OrgId = 1, OrgName = "Test Org", Slug = "test" });
        await _db.SaveChangesAsync();

        // Seed 6 active users for this org (Free max is 5)
        for (int i = 0; i < 6; i++)
        {
            _db.Users.Add(new User { UserId = i + 1, OrgId = 1, IsActive = true, Email = $"u{i}@t.com", FullName = "U", PasswordHash = "x" });
        }
        await _db.SaveChangesAsync();

        var command = new UpdateOrganizationPlanCommand(1, "Free");
        var handler = new UpdateOrganizationPlanHandler(_db);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*allows up to 5*");
    }

    [Fact]
    public async Task UpdateOrganizationPlanHandler_DowngradeViolatesAssetLimit_Throws()
    {
        _db.Organizations.Add(new Organization { OrgId = 1, OrgName = "Test Org", Slug = "test" });
        await _db.SaveChangesAsync();

        // Seed 51 non-retired assets for this org (Free max is 50)
        for (int i = 0; i < 51; i++)
        {
            _db.Assets.Add(new Asset { AssetId = i + 1, OrgId = 1, Status = AssetStatus.available, AssetName = "A" });
        }
        await _db.SaveChangesAsync();

        var command = new UpdateOrganizationPlanCommand(1, "Free");
        var handler = new UpdateOrganizationPlanHandler(_db);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*allows up to 50*");
    }

    [Fact]
    public async Task UpdateOrganizationPlanHandler_ValidSwitch_UpdatesSubscription()
    {
        _db.Organizations.Add(new Organization { OrgId = 1, OrgName = "Test Org", Slug = "test" });
        await _db.SaveChangesAsync();

        _db.Users.Add(new User { UserId = 1, OrgId = 1, IsActive = true, Email = "u@t.com", FullName = "U", PasswordHash = "x" });
        await _db.SaveChangesAsync();

        var command = new UpdateOrganizationPlanCommand(1, "Pro");
        var handler = new UpdateOrganizationPlanHandler(_db);
        
        await handler.Handle(command, CancellationToken.None);

        var activeSub = await _db.OrgSubscriptions.FirstOrDefaultAsync(s => s.OrgId == 1 && s.Status == SubscriptionStatus.active);
        
        activeSub.Should().NotBeNull();
        activeSub!.PlanId.Should().BeGreaterThan(0);
        
        var plan = await _db.SubscriptionPlans.FindAsync(activeSub.PlanId);
        plan!.PlanName.Should().Be("Pro");
    }
}
