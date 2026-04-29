namespace Fluxion.Infrastructure.Email;

/// <summary>
/// Centralised, Fluxion-branded HTML email templates that match
/// the existing Welcome / ForgotPassword design language.
/// </summary>
public static class FluxionEmailTemplates
{
    // ──────────────────────────────────────────────────────────
    //  Shared fragments
    // ──────────────────────────────────────────────────────────
    private static readonly string LogoImg = @"
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
      <tr>
        <td style=""width:36px;height:36px;background-color:#C84B2F;border-radius:9px;text-align:center;line-height:36px;"">
          <span style=""font-size:18px;color:#fff;"">&#8862;</span>
        </td>
      </tr>
      </table>";

    private static string Wrapper(string titleTag, string preheader, string body)
    {
        var year = DateTime.UtcNow.Year;
        return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
  <meta name=""x-apple-disable-message-reformatting"">
  <title>{titleTag}</title>
  <style>
    body, table, td, a {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    table, td {{ mso-table-lspace:0pt; mso-table-rspace:0pt; }}
    img {{ border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }}
    body {{ margin:0!important; padding:0!important; width:100%!important; }}
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    @media screen and (max-width:600px) {{
      .wrap {{ width:100%!important; max-width:100%!important; }}
      .mpad {{ padding-left:20px!important; padding-right:20px!important; }}
    }}
  </style>
</head>
<body style=""margin:0;padding:0;background-color:#F2EFE8;font-family:'Poppins','Segoe UI',Roboto,sans-serif;"">

<!-- Preheader -->
<div style=""display:none;max-height:0;overflow:hidden;mso-hide:all;"">
  {preheader}
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
          {LogoImg}
        </td>
        <td style=""vertical-align:middle;"">
          <span style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:22px;color:#0D0D0D;letter-spacing:-.03em;"">FLUXION</span>
        </td>
      </tr>
      </table>
    </td>
  </tr>

  <!-- MAIN CARD -->
  <tr>
    <td>
      <table class=""card"" role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
        style=""background-color:#ffffff;border-radius:14px;border:1.5px solid rgba(13,13,13,.1);overflow:hidden;"">

        <tr><td style=""height:3px;background:linear-gradient(90deg,#C84B2F,#E8960A 45%,#2A7A4B);font-size:0;line-height:0;"">&nbsp;</td></tr>

        <tr>
          <td class=""mpad"" style=""padding:40px 44px 36px;background-color:#ffffff;"">
            {body}
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
            You're receiving this because you have an account on Fluxion.
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
    }

    // ──────────────────────────────────────────────────────────
    //  Detail row helper
    // ──────────────────────────────────────────────────────────
    private static string DetailRow(string label, string value)
    {
        return $@"
          <tr>
            <td style=""padding:10px 18px;border-bottom:1px solid rgba(13,13,13,.06);"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"">
              <tr>
                <td style=""width:40%;font-family:'Poppins',sans-serif;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;"">{label}</td>
                <td style=""font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;color:#0D0D0D;"">{value}</td>
              </tr>
              </table>
            </td>
          </tr>";
    }

    // ══════════════════════════════════════════════════════════
    //  1. ASSET ASSIGNED
    // ══════════════════════════════════════════════════════════
    public static string AssetAssigned(
        string assigneeName,
        string assignedByName,
        string assetName,
        string assetType,
        string? serialNumber,
        DateTime assignedDate,
        string frontendUrl = "http://localhost:5173")
    {
        var body = $@"
            <p style=""font-size:32px;margin:0 0 20px;line-height:1;"">📦</p>

            <h1 style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:26px;letter-spacing:-.04em;color:#0D0D0D;margin:0 0 6px;line-height:1.15;"">
              Asset Assigned to You
            </h1>

            <p style=""font-family:'Poppins','Segoe UI',sans-serif;font-size:13px;color:#5A6472;line-height:1.8;margin:14px 0 28px;"">
              Hi <strong style=""color:#0D0D0D;"">{assigneeName}</strong>, an asset has been assigned to you by
              <strong style=""color:#C84B2F;"">{assignedByName}</strong>.
              Please review the details below.
            </p>

            <!-- Details card -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;margin-bottom:28px;overflow:hidden;"">
              {DetailRow("Asset Name", assetName)}
              {DetailRow("Asset Type", assetType)}
              {DetailRow("Serial Number", serialNumber ?? "N/A")}
              {DetailRow("Assigned By", assignedByName)}
              {DetailRow("Assigned Date", assignedDate.ToString("dd MMM yyyy, HH:mm") + " UTC")}
            </table>

            <!-- CTA -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
            <tr>
              <td style=""background-color:#0D0D0D;border-radius:8px;"">
                <a href=""{frontendUrl}/assigned-assets"" style=""display:block;padding:15px 36px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;"">
                  → &nbsp;View My Assets
                </a>
              </td>
            </tr>
            </table>";

        return Wrapper(
            "Fluxion — Asset Assigned to You",
            $"📦 {assetName} has been assigned to you by {assignedByName}.",
            body);
    }

    // ══════════════════════════════════════════════════════════
    //  2. TICKET STATUS UPDATED
    // ══════════════════════════════════════════════════════════
    public static string TicketStatusUpdated(
        string recipientName,
        int ticketId,
        string ticketTitle,
        string oldStatus,
        string newStatus,
        string technicianName,
        string assetName,
        string frontendUrl = "http://localhost:5173")
    {
        var statusColor = newStatus.ToLower() switch
        {
            "resolved" or "closed" => "#2A7A4B",
            "in_progress"          => "#2A6FC8",
            "waiting_parts"        => "#E8960A",
            _                      => "#C84B2F"
        };

        var body = $@"
            <p style=""font-size:32px;margin:0 0 20px;line-height:1;"">🔄</p>

            <h1 style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:26px;letter-spacing:-.04em;color:#0D0D0D;margin:0 0 6px;line-height:1.15;"">
              Ticket Status Updated
            </h1>

            <p style=""font-family:'Poppins','Segoe UI',sans-serif;font-size:13px;color:#5A6472;line-height:1.8;margin:14px 0 28px;"">
              Hi <strong style=""color:#0D0D0D;"">{recipientName}</strong>, the status of your maintenance ticket has been updated by technician
              <strong style=""color:#C84B2F;"">{technicianName}</strong>.
            </p>

            <!-- Status badge -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:rgba(200,75,47,.06);border:1.5px solid rgba(200,75,47,.18);border-radius:9px;margin-bottom:24px;"">
            <tr>
              <td style=""padding:18px 22px;text-align:center;"">
                <span style=""font-family:'Poppins',sans-serif;font-size:13px;color:#9CA3AF;text-decoration:line-through;"">{FormatStatus(oldStatus)}</span>
                <span style=""font-family:'Poppins',sans-serif;font-size:16px;color:#9CA3AF;padding:0 12px;"">→</span>
                <span style=""font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;color:{statusColor};background-color:{statusColor}1A;padding:6px 16px;border-radius:20px;"">{FormatStatus(newStatus)}</span>
              </td>
            </tr>
            </table>

            <!-- Details card -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;margin-bottom:28px;overflow:hidden;"">
              {DetailRow("Ticket ID", $"#{ticketId}")}
              {DetailRow("Title", ticketTitle)}
              {DetailRow("Asset", assetName)}
              {DetailRow("Updated By", technicianName)}
            </table>

            <!-- CTA -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
            <tr>
              <td style=""background-color:#0D0D0D;border-radius:8px;"">
                <a href=""{frontendUrl}/tickets"" style=""display:block;padding:15px 36px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;"">
                  → &nbsp;View My Tickets
                </a>
              </td>
            </tr>
            </table>";

        return Wrapper(
            "Fluxion — Ticket Status Updated",
            $"🔄 Your ticket \"{ticketTitle}\" is now {FormatStatus(newStatus)}.",
            body);
    }

    // ══════════════════════════════════════════════════════════
    //  3. ASSET CONDITION UPDATED
    // ══════════════════════════════════════════════════════════
    public static string AssetConditionUpdated(
        string recipientName,
        string assetName,
        string assetType,
        string? serialNumber,
        string oldCondition,
        string newCondition,
        string technicianName,
        string frontendUrl = "http://localhost:5173")
    {
        var conditionColor = newCondition.ToLower() switch
        {
            "available"         => "#2A7A4B",
            "assigned"          => "#2A6FC8",
            "under_maintenance" => "#E8960A",
            "retired"           => "#C84B2F",
            _                   => "#0D0D0D"
        };

        var body = $@"
            <p style=""font-size:32px;margin:0 0 20px;line-height:1;"">🛠️</p>

            <h1 style=""font-family:'Poppins','Segoe UI',sans-serif;font-weight:800;font-size:26px;letter-spacing:-.04em;color:#0D0D0D;margin:0 0 6px;line-height:1.15;"">
              Asset Condition Updated
            </h1>

            <p style=""font-family:'Poppins','Segoe UI',sans-serif;font-size:13px;color:#5A6472;line-height:1.8;margin:14px 0 28px;"">
              Hi <strong style=""color:#0D0D0D;"">{recipientName}</strong>, the condition of an asset assigned to you has been updated by technician
              <strong style=""color:#C84B2F;"">{technicianName}</strong>.
            </p>

            <!-- Condition badge -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:rgba(200,75,47,.06);border:1.5px solid rgba(200,75,47,.18);border-radius:9px;margin-bottom:24px;"">
            <tr>
              <td style=""padding:18px 22px;text-align:center;"">
                <span style=""font-family:'Poppins',sans-serif;font-size:13px;color:#9CA3AF;text-decoration:line-through;"">{FormatStatus(oldCondition)}</span>
                <span style=""font-family:'Poppins',sans-serif;font-size:16px;color:#9CA3AF;padding:0 12px;"">→</span>
                <span style=""font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;color:{conditionColor};background-color:{conditionColor}1A;padding:6px 16px;border-radius:20px;"">{FormatStatus(newCondition)}</span>
              </td>
            </tr>
            </table>

            <!-- Details card -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%""
              style=""background-color:#FAFAF9;border:1.5px solid rgba(13,13,13,.08);border-radius:10px;margin-bottom:28px;overflow:hidden;"">
              {DetailRow("Asset Name", assetName)}
              {DetailRow("Asset Type", assetType)}
              {DetailRow("Serial Number", serialNumber ?? "N/A")}
              {DetailRow("Updated By", technicianName)}
            </table>

            <!-- CTA -->
            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"">
            <tr>
              <td style=""background-color:#0D0D0D;border-radius:8px;"">
                <a href=""{frontendUrl}/assigned-assets"" style=""display:block;padding:15px 36px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;"">
                  → &nbsp;View My Assets
                </a>
              </td>
            </tr>
            </table>";

        return Wrapper(
            "Fluxion — Asset Condition Updated",
            $"🛠️ The condition of {assetName} has been updated to {FormatStatus(newCondition)}.",
            body);
    }

    // ──────────────────────────────────────────────────────────
    //  Format status enum string for display
    // ──────────────────────────────────────────────────────────
    private static string FormatStatus(string status)
    {
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo
            .ToTitleCase(status.Replace("_", " "));
    }
}
