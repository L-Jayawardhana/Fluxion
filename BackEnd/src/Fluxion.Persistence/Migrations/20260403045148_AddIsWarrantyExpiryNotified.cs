using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fluxion.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIsWarrantyExpiryNotified : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsWarrantyExpiryNotified",
                table: "Assets",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsWarrantyExpiryNotified",
                table: "Assets");
        }
    }
}
