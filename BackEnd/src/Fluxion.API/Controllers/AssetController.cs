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
}

public record AssignAssetRequest(int UserId, int OrgId, int AssignedBy);
