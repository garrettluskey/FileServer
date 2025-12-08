using FileServer.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace FileServer.Controllers;

[ApiController]
[Route("download")]
public class DownloadController : ControllerBase
{
    private readonly ILogger<FileController> _logger;
    private readonly IBasePathProvider _basePathProvider;

    public DownloadController(ILogger<FileController> logger,
        IBasePathProvider basePathProvider)
    {
        _logger = logger;
        _basePathProvider = basePathProvider;
    }

    // GET /files/{*path}
    // If path is a directory: returns its contents.
    // If path is a file: streams the file as a download.
    [HttpGet("{*path}")]
    public IActionResult Get(string? path)
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
            return BadRequest();
        }

        // If it's a file, return it as a download
        if (!System.IO.File.Exists(fullPath)) return NotFound();

        // Determine content type
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fullPath, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        var fileName = Path.GetFileName(fullPath);
        var stream = System.IO.File.OpenRead(fullPath);

        // This File(...) is ControllerBase.File, not System.IO.File
        return File(stream, contentType, fileName);
    }
}
