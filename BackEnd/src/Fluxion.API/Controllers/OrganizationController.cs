using Fluxion.Application.Features.Organizations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public OrganizationController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _mediator.Send(new GetAllOrganizationsQuery());
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return CreatedAtAction(nameof(Create), new { id = result.OrgId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/logo")]
    public async Task<IActionResult> UploadLogo(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        // Validate file type
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".svg", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Only PNG, JPG, SVG, and WebP images are allowed." });

        // Validate file size (2 MB max)
        if (file.Length > 2 * 1024 * 1024)
            return BadRequest(new { message = "Logo must be under 2 MB." });

        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "logos");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"org-{id}-{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var logoUrl = $"/uploads/logos/{fileName}";

        // Update org in DB
        var org = await _mediator.Send(new UpdateOrgLogoCommand(id, logoUrl));

        return Ok(new { logoUrl });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateOrganizationCommand command)
    {
        if (id != command.OrgId) return BadRequest("ID mismatch");
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _mediator.Send(new DeleteOrganizationCommand(id));
        return NoContent();
    }

    [HttpPost("{id}/logo-base64")]
    public async Task<IActionResult> UploadLogoBase64(int id, [FromBody] UploadLogoBase64Dto dto, [FromServices] Fluxion.Application.Interfaces.IImageService imageService)
    {
        if (string.IsNullOrEmpty(dto.Base64))
            return BadRequest(new { message = "No image data provided." });

        var base64Data = dto.Base64;
        var match = System.Text.RegularExpressions.Regex.Match(base64Data, @"data:image/(?<type>.+?);base64,(?<data>.+)");
        if (match.Success)
        {
            base64Data = match.Groups["data"].Value;
        }

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(base64Data);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid base64 string." });
        }

        if (bytes.Length > 2 * 1024 * 1024)
            return BadRequest(new { message = "Logo must be under 2 MB." });

        using var stream = new MemoryStream(bytes);
        var logoUrl = await imageService.UploadImageAsync(stream, dto.Name ?? $"org-{id}-logo");

        var org = await _mediator.Send(new UpdateOrgLogoCommand(id, logoUrl));

        return Ok(new { logoUrl });
    }
}

public class UploadLogoBase64Dto
{
    public string? Name { get; set; }
    public string Base64 { get; set; } = string.Empty;
}
