using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fluxion.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixDepartmentForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the existing foreign key constraint on OrganizationOrgId
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Organizations_OrganizationOrgId",
                table: "Departments");

            // Drop the index on OrganizationOrgId
            migrationBuilder.DropIndex(
                name: "IX_Departments_OrganizationOrgId",
                table: "Departments");

            // Drop the OrganizationOrgId column
            migrationBuilder.DropColumn(
                name: "OrganizationOrgId",
                table: "Departments");

            // Add a foreign key constraint on OrgId
            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Organizations_OrgId",
                table: "Departments",
                column: "OrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId",
                onDelete: ReferentialAction.Cascade);

            // Create index on OrgId for better query performance
            migrationBuilder.CreateIndex(
                name: "IX_Departments_OrgId",
                table: "Departments",
                column: "OrgId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the new foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Organizations_OrgId",
                table: "Departments");

            // Drop the index on OrgId
            migrationBuilder.DropIndex(
                name: "IX_Departments_OrgId",
                table: "Departments");

            // Re-add the OrganizationOrgId column
            migrationBuilder.AddColumn<int>(
                name: "OrganizationOrgId",
                table: "Departments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Restore the old foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Organizations_OrganizationOrgId",
                table: "Departments",
                column: "OrganizationOrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId",
                onDelete: ReferentialAction.Cascade);

            // Restore the index on OrganizationOrgId
            migrationBuilder.CreateIndex(
                name: "IX_Departments_OrganizationOrgId",
                table: "Departments",
                column: "OrganizationOrgId");
        }
    }
}
