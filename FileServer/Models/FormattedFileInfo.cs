using FileServer.Formatters;

namespace FileServer.Models;

public readonly struct FormattedFileInfo
{
    public bool IsDirectory { get; init; }
    public string Name { get; init; }
    public long Size { get; init; }
}
