using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets;

public class SendWarrantyExpiryEmailCommandHandler : IRequestHandler<SendWarrantyExpiryEmailCommand, Result<string>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailService _emailService;

    public SendWarrantyExpiryEmailCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IEmailService emailService)
    {
        _db = db;
        _currentUser = currentUser;
        _emailService = emailService;
    }

    public async Task<Result<string>> Handle(SendWarrantyExpiryEmailCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        var role = _currentUser.Role?.ToLower();

        if (userId == null || string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("Unauthorized access.");

        var isOwner = role is "owner" or "admin" or "systemadmin";
        if (!isOwner)
            throw new ForbiddenException("This action is only available to owners.");

        var caller = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value, cancellationToken);
        if (caller == null) throw new UnauthorizedAccessException("User not found.");

        var asset = await _db.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == caller.OrgId, cancellationToken);

        if (asset == null)
            throw new KeyNotFoundException("Asset not found");

        var assignment = await _db.AssetAssignments
            .Include(aa => aa.User)
            .Where(aa => aa.AssetId == asset.AssetId && aa.ReturnDate == null)
            .OrderByDescending(aa => aa.AssignedDate)
            .FirstOrDefaultAsync(cancellationToken);

        string subject = $"Warranty Notice: {asset.AssetName} ({asset.SerialNumber ?? "No SN"})";
        string body = $@"
            <div style=""font-family: sans-serif; max-width: 600px; margin: auto;"">
                <h2 style=""color: #c84b2f;"">Warranty Expiry Notice</h2>
                <p>The warranty for the following asset has ended or is ending soon:</p>
                <div style=""background: #f4f4f4; padding: 15px; border-radius: 8px;"">
                    <ul style=""list-style-type: none; padding: 0; margin: 0;"">
                        <li style=""margin-bottom: 8px;""><strong>Asset Name:</strong> {asset.AssetName}</li>
                        <li style=""margin-bottom: 8px;""><strong>Asset Type:</strong> {asset.AssetType}</li>
                        <li style=""margin-bottom: 8px;""><strong>Serial Number:</strong> {asset.SerialNumber ?? "N/A"}</li>
                        <li style=""margin-bottom: 8px;""><strong>Status:</strong> {asset.Status.ToString().Replace("_"," ")}</li>
                        <li style=""margin-bottom: 8px;""><strong>Warranty End:</strong> {asset.WarrantyEndDate?.ToString("yyyy-MM-dd") ?? "N/A"}</li>
                    </ul>
                </div>
        ";

        if (assignment != null && assignment.User != null)
        {
            body += $@"
                <p style=""margin-top: 20px;"">
                    <strong>Currently Assigned To:</strong><br/>
                    {assignment.User.FullName} ({assignment.User.Email})
                </p>";
        }

        body += @"
                <hr style=""border: none; border-top: 1px solid #ddd; margin: 25px 0;"" />
                <p style=""font-size: 12px; color: #888;"">This is an automated message from the Fluxion platform.</p>
            </div>";

        // Sending to caller (owner) so they receive the record/reminder.
        await _emailService.SendEmailAsync(caller.Email, subject, body);

        return Result<string>.Success("Email sent successfully.");
    }
}
