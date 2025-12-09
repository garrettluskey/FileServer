using FileServer.DirectorySizeCache;
using FileServer.Providers;
using FileServer.Services.DirectorySizeService;

public static class BasePathService
{
    public static IServiceCollection AddBasePathService(this IServiceCollection services)
    {
        services.AddSingleton<IBasePathProvider, BasePathProvider>();

        return services;
    }
}
