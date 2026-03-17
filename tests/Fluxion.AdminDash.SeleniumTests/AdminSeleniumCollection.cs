using Xunit;

namespace Fluxion.AdminDash.SeleniumTests;

[CollectionDefinition("AdminSelenium")]
public sealed class AdminSeleniumCollection : ICollectionFixture<AdminSeleniumFixture>
{
}
