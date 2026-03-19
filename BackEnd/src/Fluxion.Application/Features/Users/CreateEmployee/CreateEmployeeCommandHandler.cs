using Fluxion.Application.Features.Authentication.Register;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Fluxion.Application.Features.Users.CreateEmployee;

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, RegisterResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IInvitationService _invitationService;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IInvitationService invitationService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _invitationService = invitationService;
    }

    public async Task<RegisterResponse> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (emailExists)
            throw new InvalidOperationException("A user with this email already exists.");

        // 2. Validate OrgId and DepartmentId
        var orgExists = await _context.Organizations
            .AnyAsync(o => o.OrgId == request.OrgId, cancellationToken);
        if (!orgExists)
            throw new InvalidOperationException("The specified organization does not exist.");

        var deptExists = await _context.Departments
            .AnyAsync(d => d.DepartmentId == request.DepartmentId && d.OrgId == request.OrgId, cancellationToken);
        if (!deptExists)
            throw new InvalidOperationException("The specified department does not exist in this organization.");

        // 3. Generate invitation token via Infrastructure service
        var token = _invitationService.GenerateInvitationToken();

        // 4. Create User with Employee role
        var user = new User
        {
            OrgId = request.OrgId,
            FullName = $"{request.FirstName} {request.LastName}".Trim(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.user,
            MustChangePassword = true,
            IsActive = true,
            InvitationAccepted = false,
            InvitationToken = token,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UserDepartments = new List<UserDepartment>
            {
                new UserDepartment { DepartmentId = request.DepartmentId }
            }
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Send invitation email via Infrastructure service
        await _invitationService.SendInvitationEmailAsync(user.Email, user.FullName, token);

        return new RegisterResponse(
            UserId: user.UserId,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Token: string.Empty
        );
    }
}
