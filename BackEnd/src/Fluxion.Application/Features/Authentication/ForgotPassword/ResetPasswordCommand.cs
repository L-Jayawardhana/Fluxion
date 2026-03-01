using MediatR;

namespace Fluxion.Application.Features.Authentication.ForgotPassword;

public record ResetPasswordCommand(string Email, string Code, string NewPassword) : IRequest<ResetPasswordResponse>;

public record ResetPasswordResponse(bool Success, string Message);
