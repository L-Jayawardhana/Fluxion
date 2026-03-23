using MediatR;

namespace Fluxion.Application.Features.Assets.GetAssignedAssets;

public record GetAssignedAssetsQuery(int UserId, int OrgId) : IRequest<List<AssignedAssetDto>>;

public record AssignedAssetDto(
    int AssignmentId,
    int AssetId,
    string AssetName,
    string AssetTag,
    string AssetType,
    string? SerialNumber,
    string? DepartmentName,
    DateTime? PurchaseDate,
    DateTime? WarrantyEndDate,
    DateTime AssignedDate
);
