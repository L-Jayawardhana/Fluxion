using Xunit;

namespace Fluxion.FrontEnd.SeleniumTests;

[CollectionDefinition("Selenium")]
public sealed class SeleniumCollection : ICollectionFixture<SeleniumFixture>
{
}
