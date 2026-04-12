using System.Linq;
using FluentValidation;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Features.MaintenanceLogs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Fluxion.API.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize(Roles = "owner,technician,user,admin,systemadmin,manager")]
public class MaintenanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public MaintenanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET /api/maintenance/assets/{assetId}/log-page
    [HttpGet("assets/{assetId:int}/log-page")]
    public async Task<IActionResult> GetMaintenanceLogPage(
        int assetId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        try
        {
            var query = new GetMaintenanceLogPageQuery
            {
                AssetId = assetId,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return UnprocessableEntity(Result<MaintenanceLogPageDto>.Failure(BuildValidationMessage(ex)));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, Result<MaintenanceLogPageDto>.Failure(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Result<MaintenanceLogPageDto>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Result<MaintenanceLogPageDto>.Failure(ex.Message));
        }
    }

    // POST /api/maintenance/tickets/{ticketId}/comments
    [HttpPost("tickets/{ticketId:int}/comments")]
    public async Task<IActionResult> AddComment(
        int ticketId,
        [FromBody] AddMaintenanceCommentRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var command = new AddMaintenanceCommentCommand(ticketId, request.Content, request.IsVisibleToEmployee);
            var result = await _mediator.Send(command, ct);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return UnprocessableEntity(Result<MaintenanceCommentDto>.Failure(BuildValidationMessage(ex)));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, Result<MaintenanceCommentDto>.Failure(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Result<MaintenanceCommentDto>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Result<MaintenanceCommentDto>.Failure(ex.Message));
        }
    }

    // GET /api/maintenance/reports/cost
    [HttpGet("reports/cost")]
    [Authorize(Roles = "owner,admin,systemadmin,manager")]
    public async Task<IActionResult> GetMaintenanceCostReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        try
        {
            var query = new GetMaintenanceCostReportQuery
            {
                StartDate = startDate,
                EndDate = endDate,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await _mediator.Send(query, ct);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return UnprocessableEntity(Result<MaintenanceCostReportDto>.Failure(BuildValidationMessage(ex)));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, Result<MaintenanceCostReportDto>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(Result<MaintenanceCostReportDto>.Failure(ex.Message));
        }
    }

    private static string BuildValidationMessage(ValidationException ex)
    {
        return string.Join("; ", ex.Errors.Select(e => e.ErrorMessage).Distinct());
    }

    [HttpGet("financial-insights")]
    public async Task<IActionResult> GetFinancialInsights([FromQuery] int? orgId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken ct)
    {
        try {
            var query = new Fluxion.Application.Features.Financial.GetFinancialInsightsQuery {
                OrgId = orgId,
                StartDate = startDate,
                EndDate = endDate
            };
            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
        catch (Fluxion.Application.Exceptions.ForbiddenException ex) {
            return StatusCode(StatusCodes.Status403Forbidden, Fluxion.Application.DTOs.Common.Result<Fluxion.Application.Features.Financial.FinancialInsightsDto>.Failure(ex.Message));
        }
        catch (UnauthorizedAccessException ex) {
            return Unauthorized(Fluxion.Application.DTOs.Common.Result<Fluxion.Application.Features.Financial.FinancialInsightsDto>.Failure(ex.Message));
        }
        catch (Exception ex) {
            return StatusCode(StatusCodes.Status500InternalServerError, Fluxion.Application.DTOs.Common.Result<Fluxion.Application.Features.Financial.FinancialInsightsDto>.Failure(ex.Message));
        }
    }
}

public record AddMaintenanceCommentRequest(string Content, bool? IsVisibleToEmployee);
