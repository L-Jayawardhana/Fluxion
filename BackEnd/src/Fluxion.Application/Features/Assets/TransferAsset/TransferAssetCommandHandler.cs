using Fluxion.Application.Interfaces;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets.TransferAsset;

public class TransferAssetCommandHandler : IRequestHandler<TransferAssetCommand>
{
    private readonly IApplicationDbContext _context;

    public TransferAssetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task Handle(TransferAssetCommand request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId, cancellationToken);

        if (asset is null)
        {
            throw new KeyNotFoundException("Asset not found or does not belong to your organization.");
        }

        if (asset.Status == AssetStatus.assigned)
        {
            throw new InvalidOperationException("Asset must be unassigned before it can be transferred to another department.");
        }

        if (asset.Status == AssetStatus.retired)
        {
            throw new InvalidOperationException("A retired asset cannot be transferred.");
        }

        // Validate target department exists and belongs to same org
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.DepartmentId == request.NewDepartmentId && d.OrgId == request.OrgId, cancellationToken);

        if (department is null)
        {
            throw new KeyNotFoundException("Target department not found or does not belong to your organization.");
        }

        if (asset.DepartmentId == request.NewDepartmentId)
        {
            throw new InvalidOperationException("Asset already belongs to this department.");
        }

        asset.DepartmentId = request.NewDepartmentId;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Update(asset);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
