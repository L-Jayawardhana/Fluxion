using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class DeleteOrganizationHandler : IRequestHandler<DeleteOrganizationCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteOrganizationHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteOrganizationCommand request, CancellationToken cancellationToken)
    {
        var org = await _context.Organizations
            .FindAsync(new object[] { request.OrgId }, cancellationToken);

        if (org == null)
            throw new Exception("Organization not found"); // Simple exception for now

        // Soft delete
        org.IsActive = false;
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
