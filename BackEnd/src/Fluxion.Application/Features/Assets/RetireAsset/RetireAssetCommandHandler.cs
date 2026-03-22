using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets.RetireAsset;

public class RetireAssetCommandHandler : IRequestHandler<RetireAssetCommand>
{
    private readonly IApplicationDbContext _context;

    public RetireAssetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RetireAssetCommand request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId, cancellationToken);

        if (asset is null)
        {
            throw new KeyNotFoundException("Asset not found or does not belong to your organization.");
        }

        if (asset.Status == AssetStatus.assigned)
        {
            throw new InvalidOperationException("Asset must be unassigned before it can be retired.");
        }

        asset.Status = AssetStatus.retired;
        asset.RetiredAt = DateTime.UtcNow;
        asset.RetiredBy = request.RetiredBy;
        
        // Ensure UpdatedAt is set
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Update(asset);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
