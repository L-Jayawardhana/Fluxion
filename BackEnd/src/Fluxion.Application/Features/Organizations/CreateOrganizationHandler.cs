using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Organizations;

public class CreateOrganizationHandler : IRequestHandler<CreateOrganizationCommand, CreateOrganizationResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateOrganizationHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateOrganizationResponse> Handle(CreateOrganizationCommand request, CancellationToken cancellationToken)
    {
        // Validate slug uniqueness
        var slugExists = await _context.Organizations
            .AnyAsync(o => o.Slug == request.Slug, cancellationToken);

        if (slugExists)
            throw new InvalidOperationException("An organisation with this URL slug already exists.");

        // Validate owner exists
        var owner = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.OwnerId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        // Create organization
        var org = new Organization
        {
            OrgName = request.OrgName,
            Slug = request.Slug,
            OwnerId = request.OwnerId,
            Timezone = request.Timezone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(org);
        await _context.SaveChangesAsync(cancellationToken);

        // Update user: link to org and promote to owner
        owner.OrgId = org.OrgId;
        owner.Role = UserRole.owner;
        owner.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateOrganizationResponse(
            OrgId: org.OrgId,
            OrgName: org.OrgName,
            Slug: org.Slug,
            LogoUrl: org.LogoUrl
        );
    }
}
