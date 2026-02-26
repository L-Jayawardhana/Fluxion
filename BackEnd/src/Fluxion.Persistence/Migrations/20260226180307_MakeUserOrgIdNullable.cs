using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fluxion.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeUserOrgIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Organizations_OrganizationOrgId",
                table: "Users");

            migrationBuilder.AlterColumn<int>(
                name: "OrganizationOrgId",
                table: "Users",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "OrgId",
                table: "Users",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Organizations_OrganizationOrgId",
                table: "Users",
                column: "OrganizationOrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Organizations_OrganizationOrgId",
                table: "Users");

            migrationBuilder.AlterColumn<int>(
                name: "OrganizationOrgId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrgId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Organizations_OrganizationOrgId",
                table: "Users",
                column: "OrganizationOrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
