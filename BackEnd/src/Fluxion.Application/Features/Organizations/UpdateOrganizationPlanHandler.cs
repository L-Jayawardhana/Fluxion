using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class UpdateOrganizationPlanHandler : IRequestHandler<UpdateOrganizationPlanCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrganizationPlanHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateOrganizationPlanCommand request, CancellationToken cancellationToken)
    {
        // 1. Ensure Organization exists
        var org = await _context.Organizations
            .FirstOrDefaultAsync(o => o.OrgId == request.OrgId, cancellationToken);
        
        if (org == null)
            throw new InvalidOperationException($"Organization with ID {request.OrgId} not found.");

        // 2. Seeding plans if not present
        var anyPlans = await _context.SubscriptionPlans.AnyAsync(cancellationToken);
        if (!anyPlans)
        {
            var plans = new List<SubscriptionPlan>
            {
                new() { PlanName = "Free", PriceMonthly = 0, MaxUsers = 5, MaxAssets = 50, IsActive = true, Features = "[]" },
                new() { PlanName = "Pro", PriceMonthly = 29, MaxUsers = 25, MaxAssets = 500, IsActive = true, Features = "[]" },
                new() { PlanName = "Enterprise", PriceMonthly = 199, MaxUsers = null, MaxAssets = null, IsActive = true, Features = "[]" }
            };
            _context.SubscriptionPlans.AddRange(plans);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 3. Find target plan
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.PlanName.ToLower() == request.PlanName.ToLower(), cancellationToken);
        
        if (plan == null)
            throw new InvalidOperationException($"Plan '{request.PlanName}' not found.");

        // 4. Downgrade Validation
        if (plan.MaxUsers.HasValue)
        {
            var currentUserCount = await _context.Users.CountAsync(u => u.OrgId == request.OrgId && u.IsActive, cancellationToken);
            if (currentUserCount > plan.MaxUsers.Value)
            {
                throw new InvalidOperationException($"Cannot switch to {plan.PlanName} plan. You currently have {currentUserCount} active users, but the {plan.PlanName} plan only allows up to {plan.MaxUsers.Value} users. Please deactivate or remove {currentUserCount - plan.MaxUsers.Value} user(s) before downgrading.");
            }
        }

        if (plan.MaxAssets.HasValue)
        {
            var currentAssetCount = await _context.Assets.CountAsync(a => a.OrgId == request.OrgId && a.Status != AssetStatus.retired, cancellationToken);
            if (currentAssetCount > plan.MaxAssets.Value)
            {
                throw new InvalidOperationException($"Cannot switch to {plan.PlanName} plan. You currently have {currentAssetCount} non-retired assets, but the {plan.PlanName} plan only allows up to {plan.MaxAssets.Value} assets. Please retire {currentAssetCount - plan.MaxAssets.Value} asset(s) before downgrading.");
            }
        }

        // 5. Update or Create Subscription
        var orgSub = await _context.OrgSubscriptions
            .FirstOrDefaultAsync(s => s.OrgId == request.OrgId && s.Status == SubscriptionStatus.active, cancellationToken);

        if (orgSub != null)
        {
            orgSub.PlanId = plan.PlanId;
            orgSub.Plan = plan;
            orgSub.MaxUsers = plan.MaxUsers;
            orgSub.MaxAssets = plan.MaxAssets;
            orgSub.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.OrgSubscriptions.Add(new OrgSubscription
            {
                OrgId = request.OrgId,
                Organization = org,
                PlanId = plan.PlanId,
                Plan = plan,
                BillingCycle = BillingCycle.monthly,
                StartedAt = DateTime.UtcNow,
                Status = SubscriptionStatus.active,
                MaxUsers = plan.MaxUsers,
                MaxAssets = plan.MaxAssets,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
