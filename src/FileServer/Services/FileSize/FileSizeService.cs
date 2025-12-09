namespace FileServer.Services.FileSize;

public static class FileSizeService
{
    public static IServiceCollection AddFileSizeService(this IServiceCollection services)
    {
        return services.AddTransient<IFileSizeProvider, FileSizeProvider>();
    }
}
