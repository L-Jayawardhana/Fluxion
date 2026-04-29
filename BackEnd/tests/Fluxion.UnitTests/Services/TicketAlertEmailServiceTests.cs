using Fluxion.Application.Interfaces;
using Fluxion.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace Fluxion.UnitTests.Services;

public class TicketAlertEmailServiceTests
{
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<TicketAlertEmailService>> _loggerMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly TicketAlertEmailService _service;

    public TicketAlertEmailServiceTests()
    {
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<TicketAlertEmailService>>();
        _configurationMock = new Mock<IConfiguration>();
        _configurationMock.Setup(c => c["FrontendUrl"]).Returns("https://test.example.com");
        _service = new TicketAlertEmailService(_emailServiceMock.Object, _loggerMock.Object, _configurationMock.Object);
    }

    [Fact]
    public async Task SendAssetAssignedEmailAsync_CallsEmailServiceWithCorrectSubjectPattern()
    {
        // Act
        await _service.SendAssetAssignedEmailAsync(
            toEmail: "test@example.com",
            assigneeName: "John Doe",
            assignedByName: "Admin User",
            assetName: "Dell XPS 15",
            assetType: "Laptop",
            serialNumber: "SN123",
            assignedDate: DateTime.UtcNow);

        // Assert
        _emailServiceMock.Verify(x => x.SendEmailAsync(
            "test@example.com", 
            It.Is<string>(s => s.Contains("Dell XPS 15") && s.Contains("assigned to you")), 
            It.Is<string>(body => body.Contains("John Doe") && body.Contains("Dell XPS 15"))), 
            Times.Once);
    }

    [Fact]
    public async Task SendTicketStatusUpdatedEmailAsync_CallsEmailServiceWithCorrectSubjectPattern()
    {
        // Act
        await _service.SendTicketStatusUpdatedEmailAsync(
            toEmail: "test2@example.com",
            recipientName: "Jane Smith",
            ticketId: 42,
            ticketTitle: "Fix Router",
            oldStatus: "Open",
            newStatus: "In Progress",
            technicianName: "Tech Guy",
            assetName: "Office Router");

        // Assert
        _emailServiceMock.Verify(x => x.SendEmailAsync(
            "test2@example.com", 
            It.Is<string>(s => s.Contains("Fix Router") && s.Contains("status updated")), 
            It.Is<string>(body => body.Contains("Jane Smith") && body.Contains("Fix Router") && body.Contains("In Progress"))), 
            Times.Once);
    }

    [Fact]
    public async Task SendAssetConditionUpdatedEmailAsync_CallsEmailServiceWithCorrectSubjectPattern()
    {
        // Act
        await _service.SendAssetConditionUpdatedEmailAsync(
            toEmail: "maintainer@example.com",
            recipientName: "Bob",
            assetName: "Delivery Van",
            assetType: "Vehicle",
            serialNumber: "VIN9876",
            oldCondition: "Good",
            newCondition: "Require Maintenance",
            technicianName: "Car Mechanic");

        // Assert
        _emailServiceMock.Verify(x => x.SendEmailAsync(
            "maintainer@example.com", 
            It.Is<string>(s => s.Contains("Condition of Delivery Van updated")), 
            It.Is<string>(body => body.Contains("Bob") && body.Contains("Delivery Van") && body.Contains("Require Maintenance"))), 
            Times.Once);
    }
}
