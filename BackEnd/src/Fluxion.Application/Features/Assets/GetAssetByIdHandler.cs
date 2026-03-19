using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets;

public class GetAssetByIdHandler : IRequestHandler<GetAssetByIdQuery, AssetDto?>
{
    private readonly IApplicationDbContext _context;

    public GetAssetByIdHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssetDto?> Handle(GetAssetByIdQuery request, CancellationToken cancellationToken)
    {
        var asset = await _context.Assets
            .AsNoTracking()
            .Where(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId)
            .Select(a => new AssetDto(
                a.AssetId,
                a.AssetName,
                a.AssetType,
                a.SerialNumber,
                a.DepartmentId,
                a.Department != null ? a.Department.DepartmentName : null,
                a.Cost,
                a.Status.ToString(),
                a.QrCode,
                a.AssetTag,
                a.PurchaseDate,
                a.WarrantyEndDate))
            .FirstOrDefaultAsync(cancellationToken);

        return asset;
    }
}
