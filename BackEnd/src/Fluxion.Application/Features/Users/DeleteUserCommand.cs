using MediatR;

namespace Fluxion.Application.Features.Users;

public record DeleteUserCommand(int UserId) : IRequest;
