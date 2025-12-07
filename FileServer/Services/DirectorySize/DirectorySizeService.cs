using FileServer.DirectorySizeCache;
using Microsoft.Extensions.DependencyInjection;

namespace FileServer.Services.DirectorySizeService;

public static class DirectorySizeService
{
    public static IServiceCollection AddDirectorySizeCache(this IServiceCollection services)
    {
        services.AddSingleton<IDirectorySizeCache, InMemoryDirectorySizeCache>();
        services.AddTransient<IDirectorySizeProvider, DirectorySizeProvider>();

        return services;
    }
}
