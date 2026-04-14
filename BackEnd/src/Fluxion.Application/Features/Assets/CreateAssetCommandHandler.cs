using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Assets;

public class CreateAssetCommandHandler : IRequestHandler<CreateAssetCommand, AssetDto>
{
    private readonly IApplicationDbContext _context;

    public CreateAssetCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssetDto> Handle(CreateAssetCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate OrgId exists
        var orgExists = await _context.Organizations
            .AnyAsync(o => o.OrgId == request.OrgId, cancellationToken);

        if (!orgExists)
            throw new KeyNotFoundException($"Organisation with ID {request.OrgId} was not found.");

        // 2. Validate DepartmentId belongs to the given OrgId
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.DepartmentId == request.DepartmentId && d.OrgId == request.OrgId,
                cancellationToken);

        if (department is null)
            throw new KeyNotFoundException(
                $"Department with ID {request.DepartmentId} was not found in organisation {request.OrgId}.");

        // 3. Generate AssetTag (AA-001, AA-002, etc. per OrgId)
        var lastAssetWithTag = await _context.Assets
            .Where(a => a.OrgId == request.OrgId && a.AssetTag != null && a.AssetTag.StartsWith("AA-"))
            .OrderByDescending(a => a.AssetId)
            .FirstOrDefaultAsync(cancellationToken);

        int nextTagNumber = 1;
        if (lastAssetWithTag != null && lastAssetWithTag.AssetTag!.Length >= 6)
        {
            var numberString = lastAssetWithTag.AssetTag.Substring(3); // e.g. "AA-001" -> "001"
            if (int.TryParse(numberString, out int number))
            {
                nextTagNumber = number + 1;
            }
        }
        string generatedAssetTag = $"AA-{nextTagNumber:D3}";

        // 4. Map command → Asset entity
        var now = DateTime.UtcNow;

        var asset = new Asset
        {
            OrgId = request.OrgId,
            DepartmentId = request.DepartmentId,
            AssetName = request.AssetName,
            AssetType = request.AssetType,
            AssetTag = generatedAssetTag,
            SerialNumber = request.SerialNumber,
            PurchaseDate = request.PurchaseDate,
            WarrantyEndDate = request.WarrantyEndDate,
            Cost = request.Cost,
            RequiresRegularService = request.RequiresRegularService,
            Status = AssetStatus.available,
            CreatedBy = request.CreatedBy,
            CreatedAt = now,
            UpdatedAt = now
        };

        // 4. Save to database (first save to generate AssetId)
        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Generate QR code value using the newly created AssetId
        asset.QrCode = $"ASSET-{asset.AssetId}";
        await _context.SaveChangesAsync(cancellationToken);

        // If the asset requires regular service, automatically create a schedule
        if (request.RequiresRegularService)
        {
            var schedule = new MaintenanceSchedule
            {
                OrgId = request.OrgId,
                AssetId = asset.AssetId,
                CreatedByManagerId = request.CreatedBy, // Admin/Owner who added the asset
                Title = $"Regular Service: {asset.AssetName}",
                TaskDescription = $"Automated regular service ticket for {asset.AssetName} ({asset.AssetTag ?? asset.SerialNumber ?? "Unknown"})",
                IntervalDays = 180, // roughly 6 months
                NextDueDate = now.AddDays(180),
                IsActive = true,
                CreatedAt = now,
                CreatedBy = request.CreatedBy,
                UpdatedAt = now,
                UpdatedBy = request.CreatedBy
            };
            
            _context.MaintenanceSchedules.Add(schedule);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 6. Return DTO
        return ToDto(asset, department.DepartmentName);
    }

    internal static AssetDto ToDto(Asset a, string? departmentName) => new(
        a.AssetId,
        a.AssetName,
        a.AssetType,
        a.SerialNumber,
        a.DepartmentId,
        departmentName,
        a.Cost,
        a.Status.ToString(),
        a.QrCode,
        a.AssetTag,
        a.PurchaseDate,
        a.WarrantyEndDate
    );
}
