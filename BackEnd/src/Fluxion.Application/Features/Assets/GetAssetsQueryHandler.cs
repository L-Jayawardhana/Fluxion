using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets;

public class GetAssetsQueryHandler : IRequestHandler<GetAssetsQuery, List<AssetDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAssetsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AssetDto>> Handle(GetAssetsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Assets
            .AsNoTracking()
            .Where(a => a.OrgId == request.OrgId);

        if (request.DepartmentId.HasValue)
            query = query.Where(a => a.DepartmentId == request.DepartmentId.Value);

        if (!string.IsNullOrWhiteSpace(request.AssetType))
            query = query.Where(a => a.AssetType == request.AssetType);

        var assets = await query
            .OrderByDescending(a => a.CreatedAt)
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
                a.WarrantyEndDate
            ))
            .ToListAsync(cancellationToken);

        return assets;
    }
}
