using MediatR;

namespace Fluxion.Application.Features.Authentication.GoogleLogin;

public record GoogleLoginCommand(string IdToken) : IRequest<GoogleLoginResponse>;
