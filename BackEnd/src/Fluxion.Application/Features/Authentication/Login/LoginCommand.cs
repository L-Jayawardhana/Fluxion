using MediatR;

namespace Fluxion.Application.Features.Authentication.Login;

public record LoginCommand(string Email, string Password, bool RememberMe = false) : IRequest<LoginResponse>;
