using MediatR;

namespace Fluxion.Application.Features.Assets;

public record CreateAssetCommand(
    int OrgId,
    int DepartmentId,
    string AssetName,
    string AssetType,
    string? AssetTag,
    string? SerialNumber,
    DateTime? PurchaseDate,
    DateTime? WarrantyEndDate,
    decimal? Cost,
    bool RequiresRegularService,
    int CreatedBy
) : IRequest<AssetDto>;
