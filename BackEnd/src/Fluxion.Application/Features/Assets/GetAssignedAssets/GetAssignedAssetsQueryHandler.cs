using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets.GetAssignedAssets;

public class GetAssignedAssetsQueryHandler : IRequestHandler<GetAssignedAssetsQuery, List<AssignedAssetDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAssignedAssetsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AssignedAssetDto>> Handle(GetAssignedAssetsQuery request, CancellationToken cancellationToken)
    {
        var assignedAssets = await _context.AssetAssignments
            .Include(a => a.Asset)
                .ThenInclude(asset => asset.Department)
            .AsNoTracking()
            .Where(a => a.UserId == request.UserId && a.OrgId == request.OrgId && a.ReturnDate == null)
            .OrderByDescending(a => a.AssignedDate)
            .Select(a => new AssignedAssetDto(
                a.AssignmentId,
                a.AssetId,
                a.Asset.AssetName,
                a.Asset.AssetTag ?? "N/A",
                a.Asset.AssetType,
                a.Asset.SerialNumber,
                a.Asset.Department != null ? a.Asset.Department.DepartmentName : null,
                a.Asset.PurchaseDate,
                a.Asset.WarrantyEndDate,
                a.AssignedDate
            ))
            .ToListAsync(cancellationToken);

        return assignedAssets;
    }
}
