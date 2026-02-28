using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public record UpdateOrgLogoCommand(int OrgId, string LogoUrl) : IRequest<Unit>;

public class UpdateOrgLogoHandler : IRequestHandler<UpdateOrgLogoCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrgLogoHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateOrgLogoCommand request, CancellationToken cancellationToken)
    {
        var org = await _context.Organizations
            .FirstOrDefaultAsync(o => o.OrgId == request.OrgId, cancellationToken)
            ?? throw new InvalidOperationException("Organisation not found.");

        org.LogoUrl = request.LogoUrl;
        org.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
