using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class UpdateOrganizationHandler : IRequestHandler<UpdateOrganizationCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrganizationHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateOrganizationCommand request, CancellationToken cancellationToken)
    {
        var org = await _context.Organizations
            .FindAsync(new object[] { request.OrgId }, cancellationToken);

        if (org == null)
            throw new Exception("Organization not found");

        org.OrgName = request.OrgName;
        org.Slug = request.Slug;
        org.Timezone = request.Timezone;
        org.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
