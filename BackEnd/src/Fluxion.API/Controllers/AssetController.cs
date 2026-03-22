using Fluxion.Application.Features.Assets;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize(Roles = "user,admin,owner")]
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
    [Authorize(Roles = "user,admin,owner")]
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
    [Authorize(Roles = "admin,owner")]
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
    [Authorize(Roles = "user,admin,owner")]
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
    [Authorize(Roles = "admin,owner")]
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
    [Authorize(Roles = "admin,owner")]
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
        catch (Exception ex)
        {
            // Debugging ONLY: Return the full exception stack trace to find the 500 error
            return StatusCode(500, new { message = $"Internal Error: {ex.Message} {ex.InnerException?.Message}" });
        }
    }

    /// <summary>Retires an asset, making it permanently unavailable.</summary>
    [HttpPut("{id:int}/retire")]
    [Authorize(Roles = "admin,owner")]
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Internal Error: {ex.Message} {ex.InnerException?.Message}" });
        }
    }

    /// <summary>Transfers an asset to a different department.</summary>
    [HttpPut("{id:int}/transfer")]
    [Authorize(Roles = "admin,owner")]
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
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Internal Error: {ex.Message} {ex.InnerException?.Message}" });
        }
    }
}

public record AssignAssetRequest(int UserId, int OrgId, int AssignedBy);
public record UnassignAssetRequest(int UserId, int OrgId);
public record RetireAssetRequest(int OrgId, int RetiredBy);
public record TransferAssetRequest(int OrgId, int NewDepartmentId, int TransferredBy);
