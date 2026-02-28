using MediatR;

namespace Fluxion.Application.Features.Authentication.Verification;

public record VerifyCodeCommand(string Email, string Code) : IRequest<VerifyCodeResponse>;

public record VerifyCodeResponse(bool IsValid, string Message);
