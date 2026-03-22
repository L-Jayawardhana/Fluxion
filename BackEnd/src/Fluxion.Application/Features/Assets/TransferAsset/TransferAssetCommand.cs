using MediatR;

namespace Fluxion.Application.Features.Assets.TransferAsset;

public record TransferAssetCommand(int AssetId, int OrgId, int NewDepartmentId, int TransferredBy) : IRequest;
