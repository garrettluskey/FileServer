using FileServer.DirectorySizeCache;
using FileServer.Providers;
using System.Collections.ObjectModel;
using System.Drawing;

namespace FileServer.Services.DirectorySizeService;

public interface IDirectorySizeProvider
{
    long GetDirectorySize(DirectoryInfo directoryInfo);
    void RecacheDirectory(DirectoryInfo directoryInfo);
}

public class DirectorySizeProvider : IDirectorySizeProvider
{

    private readonly int _maxRecusionDepth;
    private readonly IDirectorySizeCache _directorySizeCache;
    private readonly IBasePathProvider _basePathProvider;
    private readonly ILogger<DirectorySizeProvider> _logger;

    public DirectorySizeProvider(
        ILogger<DirectorySizeProvider> logger,
        IDirectorySizeCache directorySizeCache,
        IBasePathProvider basePathProvider,
        int maxRecusionDepth = 100)
    {
        _logger = logger;
        _directorySizeCache = directorySizeCache;
        _basePathProvider = basePathProvider;
        _maxRecusionDepth = maxRecusionDepth;
    }

    public void RecacheDirectory(DirectoryInfo directoryInfo)
    {
        if (directoryInfo.Parent == null)
        {
            _logger.LogError("Directory parent was null for directory {name}", directoryInfo.FullName);
            return;
        }

        _directorySizeCache.TryRemove(directoryInfo.FullName, out _);

        if (directoryInfo.FullName == _basePathProvider.BasePath)
        {
            GetDirectorySize(directoryInfo);
            return;
        }

        RecacheDirectory(directoryInfo.Parent);
    }

    public long GetDirectorySize(DirectoryInfo directoryInfo) => GetDirectorySize(directoryInfo, depth: 0);

    private long GetDirectorySize(DirectoryInfo directoryInfo, int depth)
    {
        if (depth > _maxRecusionDepth)
        {
            _logger.LogWarning(
                "Exceeded max depth {MaxDepth} at depth {Depth} for directory {Path}",
                _maxRecusionDepth, depth, directoryInfo.FullName);
            return 0;
        }

        if (!directoryInfo.Exists)
        {
            _logger.LogWarning("Directory does not exist: {Path}", directoryInfo.FullName);
            return 0;
        }

        // Return cached size if it exists
        if (_directorySizeCache.TryGet(directoryInfo.FullName, out var size)) return size;

        // Skip shortcuts/simlinks
        if (directoryInfo.Attributes.HasFlag(FileAttributes.ReparsePoint))
        {
            return 0;
        }


        long subdirectorySizes = 0;
        subdirectorySizes = directoryInfo
            .EnumerateDirectories()
            .Select(dir =>
            {
                try
                {
                    return GetDirectorySize(dir, depth + 1);
                }
                catch (UnauthorizedAccessException ex)
                {
                    _logger.LogWarning(ex, "Unauthorized when enumerating subdirectories of {Path}", directoryInfo.FullName);
                }
                catch (DirectoryNotFoundException ex)
                {
                    _logger.LogWarning(ex, "Directory disappeared while enumerating: {Path}", directoryInfo.FullName);
                }

                return 0;
            })
            .Sum();


        long fileSizes = directoryInfo
            .EnumerateFiles()
            .Sum(file => file.Length);

        var totalSize = subdirectorySizes + fileSizes;

        // Store calculated size in cache
        _directorySizeCache.AddOrUpdate(directoryInfo.FullName, totalSize);

        return totalSize;
    }
}
