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

    // GET /files/{*path}
    // Returns the contents of a directory
    [HttpGet("{*path}")]
    public IActionResult GetContents(string? path)
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

        // If it's a directory, return directory contents (current behavior)
        if (!Directory.Exists(fullPath)) return NotFound();

        var directoryInfo = new DirectoryInfo(fullPath);

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

        var result = directoryData.Concat(fileData);
        return Ok(result);
    }

    // DELETE /files/{*path}
    // Deletes either a file or a directory (recursively) under the base path
    [HttpDelete("{*path}")]
    public IActionResult Delete(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return BadRequest("Path is required.");
        }

        var fullPath = Path.GetFullPath(
            Path.Combine(_basePathProvider.BasePath, path)
        );

        if (!fullPath.StartsWith(_basePathProvider.BasePath, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid path.");
        }

        try
        {
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
                _logger.LogInformation("Deleted file at {Path}", fullPath);
                return NoContent();
            }

            if (Directory.Exists(fullPath))
            {
                Directory.Delete(fullPath, recursive: true);
                _logger.LogInformation("Deleted directory at {Path}", fullPath);
                return NoContent();
            }

            return NotFound();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized when deleting {Path}", fullPath);
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied.");
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "I/O error when deleting {Path}", fullPath);
            return StatusCode(StatusCodes.Status500InternalServerError, "Unable to delete file or directory.");
        }
    }

    // POST /files/{*path}
    // Uploads a single file into the given directory under the base path.
    // Expects multipart/form-data with a field named "file".
    [HttpPost("{*path}")]
    public async Task<IActionResult> Upload(string? path, [FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("File is required.");
        }

        // Path is the target directory relative to base
        path ??= string.Empty;

        var targetDirectory = Path.GetFullPath(
            Path.Combine(_basePathProvider.BasePath, path)
        );

        if (!targetDirectory.StartsWith(_basePathProvider.BasePath, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid path.");
        }

        // Ensure target directory exists
        Directory.CreateDirectory(targetDirectory);

        // Use just the file name (strip any path info the client might send)
        var safeFileName = Path.GetFileName(file.FileName);
        var destinationPath = Path.GetFullPath(
            Path.Combine(targetDirectory, safeFileName)
        );

        // Double-check final destination is still under base path
        if (!destinationPath.StartsWith(_basePathProvider.BasePath, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid file name or path.");
        }

        try
        {
            await using var stream = System.IO.File.Create(destinationPath);
            await file.CopyToAsync(stream);

            _logger.LogInformation("Uploaded file to {Path}", destinationPath);

            // You can return more metadata if you want
            return Created(
                uri: $"/files/{path}".TrimEnd('/'),
                value: new
                {
                    fileName = safeFileName,
                    relativePath = path,
                    size = file.Length
                });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized when uploading to {Path}", destinationPath);
            return StatusCode(StatusCodes.Status403Forbidden, "Access denied.");
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "I/O error when uploading to {Path}", destinationPath);
            return StatusCode(StatusCodes.Status500InternalServerError, "Unable to save file.");
        }
    }
}