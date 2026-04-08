using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Fluxion.Application.Features.Assets.AssignAsset;

public class AssignAssetCommandHandler : IRequestHandler<AssignAssetCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketAlertEmailService _alertEmailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AssignAssetCommandHandler> _logger;

    public AssignAssetCommandHandler(
        IApplicationDbContext context,
        ITicketAlertEmailService alertEmailService,
        INotificationService notificationService,
        ILogger<AssignAssetCommandHandler> logger)
    {
        _context = context;
        _alertEmailService = alertEmailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<bool> Handle(AssignAssetCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify Asset is in correct Organization and is Available
        var asset = await _context.Assets
            .FirstOrDefaultAsync(a => a.AssetId == request.AssetId && a.OrgId == request.OrgId, cancellationToken);
            
        if (asset == null)
            throw new InvalidOperationException("Asset not found or access denied.");
            
        if (asset.Status != AssetStatus.available)
            throw new InvalidOperationException("Asset is not available for assignment.");

        // 2. Verify User exists in same Organization
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.UserId && u.OrgId == request.OrgId, cancellationToken);
            
        if (user == null)
            throw new InvalidOperationException("User not found or access denied.");

        // 3. Get the admin/owner who is assigning
        var assignedByUser = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == request.AssignedBy, cancellationToken);

        // 4. Create Assignment record
        var assignment = new AssetAssignment
        {
            AssetId = request.AssetId,
            UserId = request.UserId,
            OrgId = request.OrgId,
            AssignedBy = request.AssignedBy,
            AssignedDate = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AssetAssignments.Add(assignment);

        // 5. Update Asset Status and map assignment tracking
        asset.Status = AssetStatus.assigned;
        asset.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // 6. Send notification email to the assigned user
        var assignedByName = assignedByUser?.FullName ?? "An administrator";
        try
        {
            await _alertEmailService.SendAssetAssignedEmailAsync(
                toEmail:        user.Email,
                assigneeName:   user.FullName,
                assignedByName: assignedByName,
                assetName:      asset.AssetName,
                assetType:      asset.AssetType,
                serialNumber:   asset.SerialNumber,
                assignedDate:   assignment.AssignedDate
            );
        }
        catch (Exception ex)
        {
            // Log but don't fail the assignment if email fails
            _logger.LogError(ex, "Failed to send asset assignment email to {Email}", user.Email);
        }

        // 7. Persist in-app notification
        await _notificationService.CreateNotificationAsync(
            orgId:   request.OrgId,
            userId:  user.UserId,
            type:    "asset_assigned",
            title:   "Asset Assigned to You",
            message: $"{asset.AssetName} has been assigned to you by {assignedByName}.",
            assetId: asset.AssetId,
            ct:      cancellationToken
        );

        return true;
    }
}
