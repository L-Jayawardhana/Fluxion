using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class GetOrganizationPlanHandler : IRequestHandler<GetOrganizationPlanQuery, string>
{
    private readonly IApplicationDbContext _context;

    public GetOrganizationPlanHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(GetOrganizationPlanQuery request, CancellationToken cancellationToken)
    {
        var orgSub = await _context.OrgSubscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.OrgId == request.OrgId && s.Status == SubscriptionStatus.active, cancellationToken);

        return orgSub?.Plan?.PlanName ?? "Free";
    }
}
