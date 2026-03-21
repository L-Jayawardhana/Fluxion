using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets.AssignAsset;

public class AssignAssetCommandHandler : IRequestHandler<AssignAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AssignAssetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AssignAssetCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify Asset is in correct Organization and is Available
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId, cancellationToken);
            
        if (asset == null)
            throw new InvalidOperationException("Asset not found or access denied.");
            
        if (asset.Status != AssetStatus.available)
            throw new InvalidOperationException("Asset is not available for assignment.");

        // 2. Verify User exists in same Organization
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.UserId && u.OrgId == request.OrgId, cancellationToken);
            
        if (user == null)
            throw new InvalidOperationException("User not found or access denied.");

        // 3. Create Assignment record
        var assignment = new AssetAssignment
        {
            AssetId = request.AssetId,
            UserId = request.UserId,
            OrgId = request.OrgId,
            AssignedBy = request.AssignedBy,
            AssignedDate = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AssetAssignments.Add(assignment);

        // 4. Update Asset Status and map assignment tracking
        asset.Status = AssetStatus.assigned;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
