using Fluxion.Application.Interfaces;
using MediatR;

namespace Fluxion.Application.Features.Authentication.Verification;

public class SendVerificationCodeHandler : IRequestHandler<SendVerificationCodeCommand, SendVerificationCodeResponse>
{
    private readonly IVerificationCodeService _codeService;
    private readonly IEmailService _emailService;

    public SendVerificationCodeHandler(IVerificationCodeService codeService, IEmailService emailService)
    {
        _codeService = codeService;
        _emailService = emailService;
    }

    public async Task<SendVerificationCodeResponse> Handle(SendVerificationCodeCommand request, CancellationToken cancellationToken)
    {
        var code = _codeService.GenerateCode(request.Email);

        var html = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
</head>
<body style=""margin:0;padding:0;background:#F2EFE8;font-family:'Segoe UI',Roboto,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#F2EFE8;padding:40px 0;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""480"" cellpadding=""0"" cellspacing=""0"" style=""background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);"">

          <!-- Header -->
          <tr>
            <td style=""background:#0D0D0D;padding:32px 40px;text-align:center;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" style=""margin:0 auto;"">
                <tr>
                  <td style=""padding-right:10px;vertical-align:middle;"">
                    <div style=""width:28px;height:28px;background:#C84B2F;border-radius:6px;display:inline-block;""></div>
                  </td>
                  <td style=""vertical-align:middle;"">
                    <span style=""font-family:'Segoe UI',Roboto,sans-serif;font-weight:800;font-size:20px;color:#F2EFE8;letter-spacing:2px;"">FLUXION</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""padding:40px 40px 20px;"">
              <h1 style=""margin:0 0 8px;font-size:22px;font-weight:700;color:#0D0D0D;letter-spacing:-0.02em;"">Verify your email</h1>
              <p style=""margin:0 0 28px;font-size:14px;color:#8A9BAD;line-height:1.6;"">
                Enter the code below to verify your email address and continue setting up your Fluxion workspace.
              </p>
            </td>
          </tr>

          <!-- Code -->
          <tr>
            <td style=""padding:0 40px 28px;"">
              <div style=""background:#F8F7F4;border:2px dashed rgba(13,13,13,0.12);border-radius:10px;padding:24px;text-align:center;"">
                <div style=""font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#8A9BAD;margin-bottom:10px;"">Your verification code</div>
                <div style=""font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0D0D0D;"">{code}</div>
              </div>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style=""padding:0 40px 36px;"">
              <p style=""margin:0;font-size:12px;color:#8A9BAD;text-align:center;"">
                This code is valid for <strong style=""color:#C84B2F;"">10 minutes</strong>. Don't share it with anyone.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style=""padding:0 40px;"">
              <div style=""height:1px;background:rgba(13,13,13,0.08);""></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""padding:24px 40px;text-align:center;"">
              <p style=""margin:0;font-size:11px;color:#8A9BAD;line-height:1.5;"">
                You received this email because a Fluxion account is being created with this email address.
                <br>If you didn't request this, you can safely ignore this email.
              </p>
              <p style=""margin:12px 0 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(138,155,173,0.6);"">
                © {DateTime.UtcNow.Year} Fluxion · Enterprise Asset Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        await _emailService.SendEmailAsync(
            request.Email,
            $"Fluxion — Your verification code is {code}",
            html
        );

        return new SendVerificationCodeResponse(true, "Verification code sent.");
    }
}
