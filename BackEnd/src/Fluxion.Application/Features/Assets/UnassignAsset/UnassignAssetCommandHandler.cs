using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets.UnassignAsset;

public class UnassignAssetCommandHandler : IRequestHandler<UnassignAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UnassignAssetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UnassignAssetCommand request, CancellationToken cancellationToken)
    {
        // 1. Find the active assignment (where ReturnDate is null)
        var assignment = await _context.AssetAssignments
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId 
                                   && a.UserId == request.UserId 
                                   && a.OrgId == request.OrgId 
                                   && a.ReturnDate == null, cancellationToken);

        if (assignment == null)
            throw new InvalidOperationException("Active assignment not found or access denied.");

        // 2. Mark the assignment as returned
        assignment.ReturnDate = DateTime.UtcNow;
        assignment.UpdatedAt = DateTime.UtcNow;

        // 3. Update the Asset status back to 'available'
        var asset = await _context.Assets.FindAsync(new object[] { request.AssetId }, cancellationToken);
        if (asset != null)
        {
            asset.Status = AssetStatus.available;
            asset.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
