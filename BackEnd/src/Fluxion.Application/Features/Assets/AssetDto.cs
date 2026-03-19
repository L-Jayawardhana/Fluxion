namespace Fluxion.Application.Features.Assets;

public record AssetDto(
    int AssetId,
    string AssetName,
    string AssetType,
    string? SerialNumber,
    int? DepartmentId,
    string? DepartmentName,
    decimal? Cost,
    string Status,
    string? QrCode,
    string? AssetTag,
    DateTime? PurchaseDate,
    DateTime? WarrantyEndDate
);
