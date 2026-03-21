using MediatR;

namespace Fluxion.Application.Features.Assets.AssignAsset;

public record AssignAssetCommand(
    int AssetId,
    int UserId,
    int OrgId,
    int AssignedBy
) : IRequest<bool>;
