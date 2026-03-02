using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class GetAllOrganizationsHandler : IRequestHandler<GetAllOrganizationsQuery, List<OrganizationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllOrganizationsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrganizationDto>> Handle(GetAllOrganizationsQuery request, CancellationToken cancellationToken)
    {
        var organizations = await _context.Organizations
            .AsNoTracking()
            .Select(o => new OrganizationDto(
                o.OrgId,
                o.OrgName,
                o.Slug,
                o.OwnerId,
                o.LogoUrl,
                o.Timezone,
                o.IsActive,
                o.CreatedAt,
                o.Users != null ? o.Users.Count : 0,
                o.Assets != null ? o.Assets.Count : 0
            ))
            .ToListAsync(cancellationToken);

        return organizations;
    }
}
