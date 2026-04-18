using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Fluxion.API.Controllers;
using Fluxion.Application.DTOs.Common;
using Fluxion.Application.Exceptions;
using Fluxion.Application.Features.MaintenanceLogs;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Fluxion.UnitTests.Controllers;

public class MaintenanceControllerTests
{
    private readonly Mock<IMediator> _mediator = new();

    private MaintenanceController CreateController() => new(_mediator.Object);

    [Fact]
    public async Task GetMaintenanceLogPage_WhenValidationFails_Returns422()
    {
        var ex = new ValidationException(new[]
        {
            new ValidationFailure("PageSize", "PageSize must be between 1 and 50")
        });

        _mediator
            .Setup(m => m.Send(It.IsAny<GetMaintenanceLogPageQuery>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(ex);

        var controller = CreateController();

        var result = await controller.GetMaintenanceLogPage(assetId: 9, pageNumber: 1, pageSize: 500, ct: CancellationToken.None);

        result.Should().BeOfType<UnprocessableEntityObjectResult>();
    }

    [Fact]
    public async Task AddComment_WhenForbidden_Returns403()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<AddMaintenanceCommentCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ForbiddenException("Access denied"));

        var controller = CreateController();

        var result = await controller.AddComment(10, new AddMaintenanceCommentRequest("private note", true), CancellationToken.None);

        var status = result.Should().BeOfType<ObjectResult>().Subject;
        status.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task AddComment_WhenTicketMissing_Returns404()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<AddMaintenanceCommentCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Ticket not found"));

        var controller = CreateController();

        var result = await controller.AddComment(404, new AddMaintenanceCommentRequest("hello", true), CancellationToken.None);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetMaintenanceCostReport_WhenUnauthorized_Returns401()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<GetMaintenanceCostReportQuery>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("Unauthorized access."));

        var controller = CreateController();

        var result = await controller.GetMaintenanceCostReport(null, null, 1, 20, CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetMaintenanceCostReport_WhenValid_ReturnsOk()
    {
        var payload = Result<MaintenanceCostReportDto>.Success(new MaintenanceCostReportDto
        {
            Data = new PagedResult<MaintenanceCostReportItemDto>(new List<MaintenanceCostReportItemDto>(), 0, 1, 20)
        });

        _mediator
            .Setup(m => m.Send(It.IsAny<GetMaintenanceCostReportQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(payload);

        var controller = CreateController();

        var result = await controller.GetMaintenanceCostReport(null, null, 1, 20, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }
}
