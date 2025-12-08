using FileServer.Models;
using FileServer.Providers;
using FileServer.Services.DirectorySizeService;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;

namespace FileServer.UnitTests;

public class FileControllerTests : IDisposable
{
    private readonly string _tempRoot;

    public FileControllerTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "FileControllerTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempRoot);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, recursive: true);
        }
    }

    private FileController CreateController(
        IDirectorySizeProvider? sizeProvider = null,
        string? basePath = null)
    {
        var loggerMock = new Mock<ILogger<FileController>>();
        sizeProvider ??= Mock.Of<IDirectorySizeProvider>();

        var basePathProviderMock = new Mock<IBasePathProvider>();
        basePathProviderMock.Setup(p => p.BasePath).Returns(basePath ?? _tempRoot);

        var controller = new FileController(
            loggerMock.Object,
            sizeProvider,
            basePathProviderMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    [Fact]
    public void GetContents_ReturnsDirectoriesAndFiles_WithinBasePath()
    {
        // Arrange
        var subDir = Path.Combine(_tempRoot, "Sub");
        Directory.CreateDirectory(subDir);

        var filePath = Path.Combine(subDir, "test.txt");
        File.WriteAllText(filePath, "hello");

        var sizeProvider = new Mock<IDirectorySizeProvider>();
        sizeProvider
            .Setup(x => x.GetDirectorySize(It.IsAny<DirectoryInfo>()))
            .Returns(42);

        var controller = CreateController(sizeProvider.Object);

        // Act
        var actionResult = controller.GetContents("Sub");

        // Assert
        // Ensure it's a 200 OK with the expected payload
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode ?? StatusCodes.Status200OK);

        var payload = Assert.IsAssignableFrom<IEnumerable<FormattedFileInfo>>(okResult.Value);
        var list = payload.ToList();

        // 0 directories (no subdir under Sub) + 1 file
        var single = Assert.Single(list);

        Assert.False(single.IsDirectory);
        Assert.Equal("test.txt", single.Name);
        Assert.Equal(new FileInfo(filePath).Length, single.Size);
    }

    [Fact]
    public void Get_Returns400_WhenPathEscapesBase()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = controller.GetContents("../evil");

        // Assert
        var badRequest = Assert.IsType<BadRequestResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
    }

    [Fact]
    public void Get_Returns404_WhenDirectoryDoesNotExist()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = controller.GetContents("DoesNotExist");

        // Assert
        var notFound = Assert.IsType<NotFoundResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public void Delete_RemovesExistingFile_AndReturnsNoContent()
    {
        // Arrange
        var controller = CreateController();

        var filePath = Path.Combine(_tempRoot, "todelete.txt");
        File.WriteAllText(filePath, "delete me");

        Assert.True(File.Exists(filePath));

        // Act
        var actionResult = controller.Delete("todelete.txt");

        // Assert
        var noContentResult = Assert.IsType<NoContentResult>(actionResult);
        Assert.False(File.Exists(filePath));
    }

    [Fact]
    public void Delete_ReturnsNotFound_WhenItemMissing()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var actionResult = controller.Delete("missing.txt");

        // Assert
        Assert.IsType<NotFoundResult>(actionResult);
    }

    [Fact]
    public async Task Upload_WritesFile_AndReturnsCreated()
    {
        // Arrange
        var controller = CreateController();

        var content = "Hello, world!";
        var contentBytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(contentBytes);

        var formFile = new FormFile(stream, 0, contentBytes.Length, "file", "hello.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        // Act
        var actionResult = await controller.Upload("uploads", formFile);

        // Assert
        var created = Assert.IsType<CreatedResult>(actionResult);
        Assert.Equal("/files/uploads", created.Location);

        var destPath = Path.Combine(_tempRoot, "uploads", "hello.txt");
        Assert.True(File.Exists(destPath));
        Assert.Equal(content, File.ReadAllText(destPath));
    }

    [Fact]
    public async Task Upload_ReturnsBadRequest_WhenFileMissing()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = await controller.Upload("uploads", file: null!);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("File is required.", badRequest.Value);
    }

    [Fact]
    public async Task Upload_ReturnsBadRequest_WhenPathEscapesBase()
    {
        // Arrange
        var controller = CreateController();

        var stream = new MemoryStream([ 1, 2, 3 ]);
        var formFile = new FormFile(stream, 0, stream.Length, "file", "test.bin");

        // Act
        var result = await controller.Upload("../evil", formFile);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Invalid path.", badRequest.Value);
    }
}
