using MediatR;

namespace Fluxion.Application.Features.Authentication.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<ForgotPasswordResponse>;

public record ForgotPasswordResponse(bool Success, string Message);
