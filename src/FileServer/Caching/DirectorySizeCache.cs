using System.Collections.Concurrent;
using System.IO;

namespace FileServer.DirectorySizeCache;

public interface IDirectorySizeCache
{
    bool TryGet(string path, out long size);
    long AddOrUpdate(string path, long size);

    bool TryRemove(string path, out long size);
}

public class InMemoryDirectorySizeCache : IDirectorySizeCache
{
    public readonly ConcurrentDictionary<string, long> _cache = new();

    public bool TryGet(string path, out long size) => _cache.TryGetValue(path, out size);
    public long AddOrUpdate(string path, long size) =>
        _cache.AddOrUpdate(
            path,
            size,                     // value when key does not exist
            (_, _) => size            // value when key already exists
        );

    public bool TryRemove(string path, out long size) => _cache.TryRemove(path, out size);
}
