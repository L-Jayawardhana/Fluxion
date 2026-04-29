using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace Fluxion.Application.Features.Authentication.Welcome;

public class SendWelcomeEmailHandler : IRequestHandler<SendWelcomeEmailCommand, Unit>
{
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public SendWelcomeEmailHandler(IEmailService emailService, IConfiguration configuration)
    {
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<Unit> Handle(SendWelcomeEmailCommand req, CancellationToken ct)
    {
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";

        var logoImg = @"
          <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr>
            <td style=""width:36px;height:36px;background-color:#C84B2F;border-radius:9px;text-align:center;line-height:36px;"">
              <span style=""font-size:18px;color:#fff;"">⊞</span>
            </td>
          </tr>
          </table>";

        var year = DateTime.UtcNow.Year;

        var html = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
  <meta name=""x-apple-disable-message-reformatting"">
  <title>Fluxion — Welcome to Your Workspace!</title>
  <style>
    body, table, td, a {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    table, td {{ mso-table-lspace:0pt; mso-table-rspace:0pt; }}
    img {{ border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }}
    body {{ margin:0!important; padding:0!important; width:100%!important; }}
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    @media screen and (max-width:600px) {{
      .wrap    {{ width:100%!important; max-width:100%!important; }}
      .mpad    {{ padding-left:20px!important; padding-right:20px!important; }}
      .feat-td {{ display:block!important; width:100%!important; padding:0 0 10px!important; }}
    }}
  </style>
</head>
<body style=""margin:0;padding:0;background-color:#F2EFE8;font-family:'Poppins','Segoe UI',Roboto,sans-serif;"">

<!-- Preheader -->
<div style=""display:none;max-height:0;overflow:hidden;mso-hide:all;"">
  🎉 Welcome to Fluxion, {req.FirstName}! Your organisation workspace is live.
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background-color:#F2EFE8;"">
<tr><td align=""center"" style=""padding:40px 16px;"">

<table class=""wrap"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""580"" style=""max-width:580px;width:100%;"">

  <!-- LOGO -->
  <tr>
    <td align=""center"" style=""padding-bottom:28px;"">
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
      <tr>
        <td style=""padding-right:10px;vertical-align:middle;"">
          {logoImg}
        </td>
        <td style=""vertical-align:middle;"">
          <span style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:22px;color:#0D0D0D;letter-spacing:-.03em;"">FLUXION</span>
        </td>
      </tr>
      </table>
    </td>
  </tr>

  <!-- HERO CARD -->
  <tr>
    <td>
      <table class=""card"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
        style=""background-color:#ffffff;border-radius:14px;border:1.5px solid rgba(13,13,13,.1);overflow:hidden;"">

        <tr><td style=""height:3px;background:linear-gradient(90deg,#C84B2F,#E8960A 45%,#2A7A4B);font-size:0;line-height:0;"">&nbsp;</td></tr>

        <tr>
          <td class=""mpad"" style=""padding:40px 44px 36px;background-color:#ffffff;"">

            <p style=""font-size:36px;margin:0 0 20px;line-height:1;"">🎉</p>

            <h1 style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.04em;color:#0D0D0D;margin:0 0 6px;line-height:1.15;"">
              Congratulations,<br>
              <span style=""color:#C84B2F;font-style:italic;"">{req.FirstName}!</span>
            </h1>

            <p style=""font-family:'Poppins','Segoe UI',sans-serif;font-size:13px;color:#5A6472;line-height:1.8;margin:14px 0 28px;"">
              Your <strong style=""color:#0D0D0D;"">{req.OrgName}</strong> workspace is live and ready. You're the <strong style=""color:#C84B2F;"">Owner</strong> of your organisation on Fluxion — the platform that keeps every asset, every ticket, and every team member organised in one place.
            </p>

            <!-- Org details box -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:rgba(200,75,47,.06);border:1.5px solid rgba(200,75,47,.18);border-radius:9px;margin-bottom:32px;"">
            <tr>
              <td style=""padding:18px 22px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
                <tr>
                  <td style=""width:33%;padding-right:8px;vertical-align:top;border-right:1px solid rgba(13,13,13,.08);"">
                    <div style=""font-family:'Poppins',sans-serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#9CA3AF;margin-bottom:5px;"">Organisation</div>
                    <div style=""font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;color:#0D0D0D;"">{req.OrgName}</div>
                  </td>
                  <td style=""width:34%;padding:0 12px;vertical-align:top;border-right:1px solid rgba(13,13,13,.08);"">
                    <div style=""font-family:'Poppins',sans-serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#9CA3AF;margin-bottom:5px;"">Workspace</div>
                    <div style=""font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;color:#0D0D0D;"">fluxion.io/{req.WorkspaceSlug}</div>
                  </td>
                  <td style=""width:33%;padding-left:12px;vertical-align:top;"">
                    <div style=""font-family:'Poppins',sans-serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#9CA3AF;margin-bottom:5px;"">Plan</div>
                    <div style=""font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;color:#C84B2F;"">{req.PlanName} ✦</div>
                  </td>
                </tr>
                </table>
              </td>
            </tr>
            </table>

            <!-- CTA button -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin-bottom:10px;"">
            <tr>
              <td style=""background-color:#0D0D0D;border-radius:8px;"">
                <a href=""{frontendUrl}/login"" style=""display:block;padding:15px 36px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;"">
                  → &nbsp;Open My Workspace
                </a>
              </td>
            </tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- spacer -->
  <tr><td style=""height:16px;""></td></tr>

  <!-- WHAT YOU CAN DO -->
  <tr>
    <td>
      <table class=""card"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
        style=""background-color:#ffffff;border-radius:14px;border:1.5px solid rgba(13,13,13,.1);overflow:hidden;"">
        <tr>
          <td class=""mpad"" style=""padding:32px 44px 28px;"">

            <p style=""font-family:'Poppins',sans-serif;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#C84B2F;margin:0 0 8px;"">— &nbsp;What you can do</p>
            <h2 style=""font-family:'Poppins',sans-serif;font-weight:800;font-size:19px;letter-spacing:-.03em;color:#0D0D0D;margin:0 0 24px;line-height:1.2;"">
              Everything Fluxion lets<br>you manage as Owner.
            </h2>

            <!-- Feature grid -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-bottom:12px;"">
            <tr>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-right:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">🏬</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Departments</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Create teams like IT, Logistics, or Finance. Organise every asset and user under the right department.</div>
                </td></tr>
                </table>
              </td>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-left:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">💻</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Asset Registry</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Register every physical asset — laptops, vehicles, printers. Each gets a unique QR code label.</div>
                </td></tr>
                </table>
              </td>
            </tr>
            </table>

            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-bottom:12px;"">
            <tr>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-right:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">👥</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Team Management</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Invite Admins, Technicians, and Users with precisely the access they need.</div>
                </td></tr>
                </table>
              </td>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-left:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">🎫</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Maintenance Tickets</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Users raise tickets, Admins assign Technicians, and every repair is logged with cost and notes.</div>
                </td></tr>
                </table>
              </td>
            </tr>
            </table>

            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-bottom:12px;"">
            <tr>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-right:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">🔄</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Asset Assignments</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Assign assets to users and track who has what. Full assignment history is kept automatically.</div>
                </td></tr>
                </table>
              </td>
              <td class=""feat-td"" valign=""top"" style=""width:50%;padding-left:6px;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
                  style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;"">
                <tr><td style=""padding:18px 18px 16px;"">
                  <div style=""font-size:24px;margin-bottom:10px;"">📊</div>
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:6px;"">Reports & Export</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.65;"">Run asset, maintenance, and warranty reports. Export as PDF or CSV for audits.</div>
                </td></tr>
                </table>
              </td>
            </tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- spacer -->
  <tr><td style=""height:16px;""></td></tr>

  <!-- GET STARTED STEPS -->
  <tr>
    <td>
      <table class=""card"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
        style=""background-color:#ffffff;border-radius:14px;border:1.5px solid rgba(13,13,13,.1);overflow:hidden;"">
        <tr><td style=""height:2px;background:linear-gradient(90deg,#2A6FC8,transparent);font-size:0;line-height:0;"">&nbsp;</td></tr>
        <tr>
          <td class=""mpad"" style=""padding:30px 44px 28px;"">

            <p style=""font-family:'Poppins',sans-serif;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#2A6FC8;margin:0 0 8px;"">— Start here</p>
            <h2 style=""font-family:'Poppins',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.03em;color:#0D0D0D;margin:0 0 22px;line-height:1.2;"">Your first 4 steps to get fully set up.</h2>

            <!-- Step 1 -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1px solid rgba(13,13,13,.07);border-radius:8px;margin-bottom:8px;"">
            <tr><td style=""padding:14px 18px;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
              <tr>
                <td style=""width:32px;vertical-align:top;padding-right:14px;"">
                  <div style=""width:28px;height:28px;background-color:#C84B2F;border-radius:6px;text-align:center;line-height:28px;font-family:'Poppins',sans-serif;font-weight:800;font-size:13px;color:#ffffff;"">1</div>
                </td>
                <td style=""vertical-align:top;"">
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:3px;"">Create your departments</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.6;"">Go to <strong>Departments → Add Department</strong> and add each team in your organisation.</div>
                </td>
              </tr>
              </table>
            </td></tr>
            </table>

            <!-- Step 2 -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1px solid rgba(13,13,13,.07);border-radius:8px;margin-bottom:8px;"">
            <tr><td style=""padding:14px 18px;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
              <tr>
                <td style=""width:32px;vertical-align:top;padding-right:14px;"">
                  <div style=""width:28px;height:28px;background-color:#2A7A4B;border-radius:6px;text-align:center;line-height:28px;font-family:'Poppins',sans-serif;font-weight:800;font-size:13px;color:#ffffff;"">2</div>
                </td>
                <td style=""vertical-align:top;"">
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:3px;"">Register your first asset</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.6;"">Go to <strong>Assets → Register Asset</strong> and add name, serial number, purchase date, and cost.</div>
                </td>
              </tr>
              </table>
            </td></tr>
            </table>

            <!-- Step 3 -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1px solid rgba(13,13,13,.07);border-radius:8px;margin-bottom:8px;"">
            <tr><td style=""padding:14px 18px;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
              <tr>
                <td style=""width:32px;vertical-align:top;padding-right:14px;"">
                  <div style=""width:28px;height:28px;background-color:#E8960A;border-radius:6px;text-align:center;line-height:28px;font-family:'Poppins',sans-serif;font-weight:800;font-size:13px;color:#ffffff;"">3</div>
                </td>
                <td style=""vertical-align:top;"">
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:3px;"">Invite your team</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.6;"">Go to <strong>Users → Invite Users</strong> and add Admins, Technicians, and Users.</div>
                </td>
              </tr>
              </table>
            </td></tr>
            </table>

            <!-- Step 4 -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1px solid rgba(13,13,13,.07);border-radius:8px;margin-bottom:24px;"">
            <tr><td style=""padding:14px 18px;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
              <tr>
                <td style=""width:32px;vertical-align:top;padding-right:14px;"">
                  <div style=""width:28px;height:28px;background-color:#2A6FC8;border-radius:6px;text-align:center;line-height:28px;font-family:'Poppins',sans-serif;font-weight:800;font-size:13px;color:#ffffff;"">4</div>
                </td>
                <td style=""vertical-align:top;"">
                  <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;color:#0D0D0D;margin-bottom:3px;"">Assign assets to users</div>
                  <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.6;"">Go to <strong>Assets → Assignments</strong> and link assets to people. Users will see them in their dashboard.</div>
                </td>
              </tr>
              </table>
            </td></tr>
            </table>

            <!-- Second CTA -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
            <tr>
              <td style=""background-color:#C84B2F;border-radius:7px;"">
                <a href=""{frontendUrl}/login"" style=""display:block;padding:13px 30px;font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;"">
                  🚀 &nbsp;Get Started Now
                </a>
              </td>
            </tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- spacer -->
  <tr><td style=""height:16px;""></td></tr>

  <!-- NEED HELP -->
  <tr>
    <td>
      <table class=""card"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
        style=""background-color:#ffffff;border-radius:14px;border:1.5px solid rgba(13,13,13,.1);overflow:hidden;"">
        <tr>
          <td class=""mpad"" style=""padding:24px 44px;"">
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
            <tr>
              <td style=""vertical-align:middle;"">
                <div style=""font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:4px;"">Need help getting started?</div>
                <div style=""font-family:'Poppins',sans-serif;font-size:11px;color:#6B7280;line-height:1.6;"">Our help centre has step-by-step guides for every feature. Or reply to this email and we'll get back to you.</div>
              </td>
              <td style=""vertical-align:middle;padding-left:20px;white-space:nowrap;"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
                <tr>
                  <td style=""border:1.5px solid rgba(13,13,13,.18);border-radius:6px;text-align:center;"">
                    <a href=""#"" style=""display:block;padding:10px 18px;font-family:'Poppins',sans-serif;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;"">Help Centre →</a>
                  </td>
                </tr>
                </table>
              </td>
            </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style=""padding:28px 8px 0;background-color:#F2EFE8;"">
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""margin-bottom:10px;"">
      <tr><td style=""border-top:1px solid rgba(13,13,13,.1);font-size:0;line-height:0;"">&nbsp;</td></tr>
      </table>
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
      <tr>
        <td align=""center"">
          <p style=""font-family:'Poppins',sans-serif;font-size:10px;color:#9CA3AF;margin:0 0 4px;line-height:1.7;"">
            You're receiving this because you just registered a Fluxion account.
          </p>
          <p style=""font-family:'Poppins',sans-serif;font-size:10px;color:#9CA3AF;margin:0;"">
            © {year} Fluxion · Enterprise Asset Management
          </p>
        </td>
      </tr>
      </table>
    </td>
  </tr>

  <tr><td style=""height:32px;""></td></tr>

</table>
</td></tr>
</table>
</body>
</html>";

        await _emailService.SendEmailAsync(
            req.Email,
            $"🎉 Welcome to Fluxion, {req.FirstName}! Your workspace is ready",
            html
        );

        return Unit.Value;
    }
}
