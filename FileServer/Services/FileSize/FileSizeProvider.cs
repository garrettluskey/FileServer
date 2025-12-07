namespace FileServer.Services.FileSize;

public interface IFileSizeProvider
{
    long GetFileSizeSafe(FileInfo fileInfo);
}

public class FileSizeProvider : IFileSizeProvider
{
    private readonly ILogger<FileSizeProvider> _logger;

    public FileSizeProvider(ILogger<FileSizeProvider> logger)
    {
        this._logger = logger;
    }

    public long GetFileSizeSafe(FileInfo fileInfo)
    {
        try
        {
            return fileInfo.Length;
        }
        catch (Exception ex) when (
            ex is UnauthorizedAccessException ||
            ex is FileNotFoundException)
        {
            _logger.LogWarning(
                ex,
                "Failed to get file size for {FilePath}.",
                fileInfo.FullName
            );
        }

        return 0;
    }
}
