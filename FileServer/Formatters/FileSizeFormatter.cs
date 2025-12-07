namespace FileServer.Formatters;

// TODO format on client
public static class FileSizeFormatter
{
    public static string FormatSize(long size)
    {
        return size switch
        {
            < 1024L => $"{size} B",

            < 1L << 20 => FormatScaled(size, 1024L, "KB"),    // < 1 MB
            < 1L << 30 => FormatScaled(size, 1L << 20, "MB"), // < 1 GB
            < 1L << 40 => FormatScaled(size, 1L << 30, "GB"), // < 1 TB
            < 1L << 50 => FormatScaled(size, 1L << 40, "TB"), // < 1 PB
            < 1L << 60 => FormatScaled(size, 1L << 50, "PB"), // < 1 EB

            _ => FormatScaled(size, 1L << 60, "EB"),           // ≥ 1 EB
        };
    }

    private static string FormatScaled(long size, long divisor, string unit)
    {
        double value = (double)size / divisor;
        return $"{value:0.0} {unit}";
    }
}