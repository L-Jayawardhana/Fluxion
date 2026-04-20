using FluentValidation;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Features.Assets;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetController : ControllerBase
{
    private readonly IMediator _mediator;

    public AssetController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Lists all assets for an organisation, optionally filtered by department and/or asset type.</summary>
    [HttpGet]
    [Authorize(Roles = "owner,admin,systemadmin,manager")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int orgId,
        [FromQuery] int? departmentId = null,
        [FromQuery] string? assetType = null)
    {
        if (orgId <= 0)
            return BadRequest(new { message = "A valid orgId is required." });

        var result = await _mediator.Send(new GetAssetsQuery(orgId, departmentId, assetType));
        return Ok(result);
    }

    /// <summary>Gets a single asset by id, scoped to the given organisation.</summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "owner,admin,systemadmin,manager")]
    public async Task<IActionResult> GetById(int id, [FromQuery] int orgId)
    {
        if (orgId <= 0)
            return BadRequest(new { message = "A valid orgId is required." });

        var result = await _mediator.Send(new GetAssetByIdQuery(id, orgId));

        if (result is null)
            return NotFound(new { message = "Asset not found." });

        return Ok(result);
    }

    /// <summary>Creates a new asset with QR code generation.</summary>
    [HttpPost]
    [Authorize(Roles = "admin,owner,manager")]
    public async Task<IActionResult> Create([FromBody] CreateAssetCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById),
                new { id = result.AssetId, orgId = command.OrgId },
                result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Lists all assets currently assigned to a user.</summary>
    [HttpGet("user/{userId:int}")]
    [Authorize(Roles = "user,owner,admin,systemadmin,manager")]
    public async Task<IActionResult> GetAssignedToUser(int userId, [FromQuery] int orgId)
    {
        var currentUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value?.ToLower()
                   ?? User.FindFirst("role")?.Value?.ToLower();

        if (currentUserIdStr != userId.ToString() && role != "admin" && role != "owner")
        {
            return Forbid();
        }

        if (orgId <= 0)
            return BadRequest(new { message = "A valid orgId is required." });

        var result = await _mediator.Send(new Fluxion.Application.Features.Assets.GetAssignedAssets.GetAssignedAssetsQuery(userId, orgId));
        return Ok(result);
    }

    /// <summary>Assigns an asset to a user.</summary>
    [HttpPut("{id:int}/assign")]
    [Authorize(Roles = "admin,owner,manager")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignAssetRequest request)
    {
        try
        {
            var command = new Fluxion.Application.Features.Assets.AssignAsset.AssignAssetCommand(
                id, request.UserId, request.OrgId, request.AssignedBy);
            
            var result = await _mediator.Send(command);
            return Ok(new { message = "Asset assigned successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Unassigns an asset from a user, making it available again.</summary>
    [HttpPut("{id:int}/unassign")]
    [Authorize(Roles = "admin,owner,manager")]
    public async Task<IActionResult> Unassign(int id, [FromBody] UnassignAssetRequest request)
    {
        try
        {
            var command = new Fluxion.Application.Features.Assets.UnassignAsset.UnassignAssetCommand(
                id, request.UserId, request.OrgId);
            
            var result = await _mediator.Send(command);
            return Ok(new { message = "Asset unassigned successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while processing your request." });
        }
    }

    /// <summary>Retires an asset, making it permanently unavailable.</summary>
    [HttpPut("{id:int}/retire")]
    [Authorize(Roles = "admin,owner,manager")]
    public async Task<IActionResult> Retire(int id, [FromBody] RetireAssetRequest request)
    {
        try
        {
            var command = new Fluxion.Application.Features.Assets.RetireAsset.RetireAssetCommand(
                id, request.OrgId, request.RetiredBy);
            
            await _mediator.Send(command);
            return Ok(new { message = "Asset retired successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while processing your request." });
        }
    }

    /// <summary>Transfers an asset to a different department.</summary>
    [HttpPut("{id:int}/transfer")]
    [Authorize(Roles = "admin,owner,manager")]
    public async Task<IActionResult> Transfer(int id, [FromBody] TransferAssetRequest request)
    {
        try
        {
            var command = new Fluxion.Application.Features.Assets.TransferAsset.TransferAssetCommand(
                id, request.OrgId, request.NewDepartmentId, request.TransferredBy);

            await _mediator.Send(command);
            return Ok(new { message = "Asset transferred successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An error occurred while processing your request." });
        }
    }

    // GET /api/Asset/reports/warranty
    /// <summary>Returns a paginated warranty expiry report for the caller's organisation. Owner only.</summary>
    [HttpGet("reports/warranty")]
    [Authorize(Roles = "owner,admin,systemadmin,manager")]
    public async Task<IActionResult> GetWarrantyExpiryReport(
        [FromQuery] int daysAhead = 90,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        try
        {
            var query = new GetWarrantyExpiryReportQuery
            {
                DaysAhead = daysAhead,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            var msg = string.Join("; ", ex.Errors.Select(e => e.ErrorMessage).Distinct());
            return UnprocessableEntity(Result<WarrantyExpiryReportDto>.Failure(msg));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, Result<WarrantyExpiryReportDto>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Result<WarrantyExpiryReportDto>.Failure(ex.Message));
        }
    }

    // POST /api/Asset/{id}/reports/warranty/notify
    /// <summary>Sends a warranty status email to the owner. Owner only.</summary>
    [HttpPost("{id:int}/reports/warranty/notify")]
    [Authorize(Roles = "owner,admin,systemadmin,manager")]
    public async Task<IActionResult> NotifyWarrantyExpiry(int id)
    {
        try
        {
            var result = await _mediator.Send(new SendWarrantyExpiryEmailCommand(id));
            return Ok(result);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, Result<string>.Failure(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Result<string>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Result<string>.Failure(ex.Message));
        }
    }
}

public record AssignAssetRequest(int UserId, int OrgId, int AssignedBy);
public record UnassignAssetRequest(int UserId, int OrgId);
public record RetireAssetRequest(int OrgId, int RetiredBy);
public record TransferAssetRequest(int OrgId, int NewDepartmentId, int TransferredBy);

