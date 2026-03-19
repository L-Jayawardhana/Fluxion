using MediatR;

namespace Fluxion.Application.Features.Users.AcceptInvite;

public record AcceptInviteCommand(string Token) : IRequest<bool>;
