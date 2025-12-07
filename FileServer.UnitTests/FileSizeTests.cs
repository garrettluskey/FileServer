using FileServer.Formatters;

namespace FileServer.UnitTests;

public class FileSizeTests
{
    [Theory]
    // bytes
    [InlineData(0UL,  "0 B")]
    [InlineData(1UL,  "1 B")]
    [InlineData(100UL, "100 B")]
    [InlineData(1_023UL, "1023 B")]

    // KB (1 KB = 1024 B)
    [InlineData(1_024UL, "1.0 KB")]
    [InlineData(1_536UL, "1.5 KB")]                 // 1.5 * 1024

    // MB (1 MB = 1024^2 B)
    [InlineData(1_048_576UL, "1.0 MB")]             // 1024^2
    [InlineData(1_572_864UL, "1.5 MB")]             // 1.5 * 1024^2

    // GB (1 GB = 1024^3 B)
    [InlineData(1_073_741_824UL, "1.0 GB")]         // 1024^3

    // TB (1 TB = 1024^4 B)
    [InlineData(1_099_511_627_776UL, "1.0 TB")]     // 1024^4

    // PB (1 PB = 1024^5 B)
    [InlineData(1_125_899_906_842_624UL, "1.0 PB")] // 1024^5

    // EB (1 EB = 1024^6 B)
    [InlineData(1_152_921_504_606_846_976UL, "1.0 EB")] // 1024^6; near upper end of ulong range
    public void Byte_Prints_Correctly(ulong size, string expectedValue)
    {
        var fileSize = FileSizeFormatter.FormatSize(size);

        Assert.Equal(expectedValue, fileSize.ToString());
    }
}
