namespace FileServer.Providers;

public interface IBasePathProvider
{
    string BasePath { get; }
}

public class BasePathProvider : IBasePathProvider
{
    private const string ROOT_ENV_NAME = "BROWSER_ROOT_DIR";

    public string BasePath { get; }
    public BasePathProvider()
    {
        var basePath = Environment.GetEnvironmentVariable(ROOT_ENV_NAME) ??
            throw new NullReferenceException($"Environment varible {ROOT_ENV_NAME} not set!");

        BasePath = Path.GetFullPath(basePath);
    }
}
