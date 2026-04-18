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
    private readonly ICurrentUserService _currentUserService;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IInvitationService invitationService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _invitationService = invitationService;
        _currentUserService = currentUserService;
    }

    public async Task<RegisterResponse> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (emailExists)
            throw new InvalidOperationException("A user with this email already exists.");

        // 2. Validate OrgId and Role
        var orgExists = await _context.Organizations
            .AnyAsync(o => o.OrgId == request.OrgId, cancellationToken);
        if (!orgExists)
            throw new InvalidOperationException("The specified organization does not exist.");

        if (string.IsNullOrWhiteSpace(request.Role) || 
            !Enum.TryParse<UserRole>(request.Role, true, out var parsedRoleResult) || 
            (parsedRoleResult != UserRole.user && parsedRoleResult != UserRole.technician && parsedRoleResult != UserRole.manager && parsedRoleResult != UserRole.admin))
        {
            throw new InvalidOperationException("Invalid role specified. Only 'user', 'technician', 'manager' or 'admin' are allowed.");
        }
        var parsedRole = parsedRoleResult;

        var currentUserRole = _currentUserService.Role?.ToLowerInvariant();
        if ((parsedRole == UserRole.manager || parsedRole == UserRole.admin) && currentUserRole != "owner" && currentUserRole != "admin")
        {
            throw new InvalidOperationException("Only owners or admins can add managers or other administrators.");
        }

        // 3. Validate Department (if applicable)
        if (parsedRole != UserRole.manager && parsedRole != UserRole.technician)
        {
            if (!request.DepartmentId.HasValue)
                throw new InvalidOperationException("Department is required for this role.");

            var deptExists = await _context.Departments
                .AnyAsync(d => d.DepartmentId == request.DepartmentId.Value && d.OrgId == request.OrgId, cancellationToken);
            if (!deptExists)
                throw new InvalidOperationException("The specified department does not exist in this organization.");
        }

        // Check user limit based on subscription
        var orgSub = await _context.OrgSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.OrgId == request.OrgId && s.Status == SubscriptionStatus.active)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);
            
        int? maxUsers = orgSub?.MaxUsers ?? orgSub?.Plan?.MaxUsers ?? 5; // Default Free plan limit
        if (maxUsers.HasValue)
        {
            var currentUserCount = await _context.Users.CountAsync(u => u.OrgId == request.OrgId && u.IsActive, cancellationToken);
            if (currentUserCount >= maxUsers.Value)
                throw new InvalidOperationException($"Subscription limit reached. Your plan allows up to {maxUsers.Value} users.");
        }

        // 4. Generate invitation token via Infrastructure service
        var token = _invitationService.GenerateInvitationToken();

        // 5. Create User with the specified role
        var user = new User
        {
            OrgId = request.OrgId,
            FullName = $"{request.FirstName} {request.LastName}".Trim(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = parsedRole,
            MustChangePassword = true,
            IsActive = true,
            InvitationAccepted = false,
            InvitationToken = token,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UserDepartments = (parsedRole == UserRole.manager || parsedRole == UserRole.technician)
                ? new List<UserDepartment>()
                : new List<UserDepartment>
                {
                    new UserDepartment { DepartmentId = request.DepartmentId!.Value }
                }
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // 6. Send invitation email via Infrastructure service
        await _invitationService.SendInvitationEmailAsync(user.Email, user.FullName, token, request.Password);

        return new RegisterResponse(
            UserId: user.UserId,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role.ToString(),
            Token: string.Empty
        );
    }
}
