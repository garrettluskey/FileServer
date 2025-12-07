using FileServer.DirectorySizeCache;
using FileServer.Models;
using FileServer.Providers;
using FileServer.Services.DirectorySizeService;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("files")]
public class FileController : ControllerBase
{
    private readonly ILogger<FileController> _logger;
    private readonly IDirectorySizeProvider _directorySizeProvider;
    private readonly IBasePathProvider _basePathProvider;

    public FileController(ILogger<FileController> logger,
        IDirectorySizeProvider directorySizeProvider,
        IBasePathProvider basePathProvider)
    {
        _logger = logger;
        _directorySizeProvider = directorySizeProvider;
        _basePathProvider = basePathProvider;
    }

    [HttpGet("{*path}")]
    public IEnumerable<FormattedFileInfo> Get(string? path)
    {
        // Normalize input path
        path ??= string.Empty;

        // Combine and normalize to full absolute path
        var fullPath = Path.GetFullPath(
            Path.Combine(_basePathProvider.BasePath, path)
        );

        // Ensure the resolved path is still inside base
        if (!fullPath.StartsWith(_basePathProvider.BasePath, StringComparison.OrdinalIgnoreCase))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            return Array.Empty<FormattedFileInfo>();
        }

        var directoryInfo = new DirectoryInfo(fullPath);

        if (!directoryInfo.Exists)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            return Array.Empty<FormattedFileInfo>();
        }

        var directoryData = directoryInfo
            .EnumerateDirectories()
            .Select(x => new FormattedFileInfo
            {
                IsDirectory = true,
                Name = x.Name,
                Size = _directorySizeProvider.GetDirectorySize(x)
            });

        var fileData = directoryInfo
            .EnumerateFiles()
            .Select(x => new FormattedFileInfo
            {
                IsDirectory = false,
                Name = x.Name,
                Size = x.Length
            });

        return directoryData.Concat(fileData);
    }
}