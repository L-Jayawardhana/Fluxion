using MediatR;

namespace Fluxion.Application.Features.Assets.UnassignAsset;

public record UnassignAssetCommand(
    int AssetId,
    int UserId,
    int OrgId
) : IRequest<bool>;
