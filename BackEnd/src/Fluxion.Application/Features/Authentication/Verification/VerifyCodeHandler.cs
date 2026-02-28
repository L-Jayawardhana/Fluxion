using Fluxion.Application.Interfaces;
using MediatR;

namespace Fluxion.Application.Features.Authentication.Verification;

public class VerifyCodeHandler : IRequestHandler<VerifyCodeCommand, VerifyCodeResponse>
{
    private readonly IVerificationCodeService _codeService;

    public VerifyCodeHandler(IVerificationCodeService codeService)
    {
        _codeService = codeService;
    }

    public Task<VerifyCodeResponse> Handle(VerifyCodeCommand request, CancellationToken cancellationToken)
    {
        var isValid = _codeService.ValidateCode(request.Email, request.Code);
        var response = isValid
            ? new VerifyCodeResponse(true, "Email verified successfully.")
            : new VerifyCodeResponse(false, "Invalid or expired verification code.");
        return Task.FromResult(response);
    }
}
