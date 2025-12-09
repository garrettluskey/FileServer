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

    [Fact]
    public void Download_ReturnsBadRequest_WhenPathEscapesBase()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = controller.Download("../evil.txt");

        // Assert
        var badRequest = Assert.IsType<BadRequestResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
    }

    [Fact]
    public void Download_ReturnsNotFound_WhenFileDoesNotExist()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = controller.Download("missing.txt");

        // Assert
        var notFound = Assert.IsType<NotFoundResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public void Download_ReturnsFileStream_WhenFileExists()
    {
        // Arrange
        var controller = CreateController();

        var fileName = "download.txt";
        var filePath = Path.Combine(_tempRoot, fileName);
        var fileContent = "Download me!";
        File.WriteAllText(filePath, fileContent);

        // Act
        var result = controller.Download(fileName);

        // Assert
        var fileResult = Assert.IsType<FileStreamResult>(result);

        // Content type should come from FileExtensionContentTypeProvider
        Assert.Equal("text/plain", fileResult.ContentType);

        // File name should be the leaf name, not the full path
        Assert.Equal(fileName, fileResult.FileDownloadName);

        // Stream should contain the file contents
        using var reader = new StreamReader(fileResult.FileStream, Encoding.UTF8, leaveOpen: false);
        // Ensure we're at the start of the stream
        if (fileResult.FileStream.CanSeek)
        {
            fileResult.FileStream.Position = 0;
        }

        var contentRead = reader.ReadToEnd();
        Assert.Equal(fileContent, contentRead);
    }

    [Fact]
    public void Search_ReturnsBadRequest_WhenQueryMissing()
    {
        // Arrange
        var controller = CreateController();

        // Act
        var result = controller.Search(null);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Query is required.", badRequest.Value);
    }

    [Fact]
    public void Search_ReturnsNotFound_WhenRootDirectoryDoesNotExist()
    {
        // Arrange: use a base path that does not exist
        var nonExistentRoot = Path.Combine(_tempRoot, "DoesNotExistRoot");
        var controller = CreateController(basePath: nonExistentRoot);

        // Act
        var result = controller.Search("foo");

        // Assert
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("Search root directory does not exist.", notFound.Value);
    }

    [Fact]
    public void Search_ReturnsMatchingFilesAndDirectories()
    {
        // Arrange
        // Directory that should match query "alp"
        var alphaDir = Path.Combine(_tempRoot, "AlphaDir");
        Directory.CreateDirectory(alphaDir);
        File.WriteAllText(Path.Combine(alphaDir, "inner.txt"), "x");

        // Files in root
        var alphaFilePath = Path.Combine(_tempRoot, "alpha.txt");
        File.WriteAllText(alphaFilePath, "alpha-file");

        var betaFilePath = Path.Combine(_tempRoot, "beta.txt");
        File.WriteAllText(betaFilePath, "beta-file");

        var sizeProvider = new Mock<IDirectorySizeProvider>();
        sizeProvider
            .Setup(p => p.GetDirectorySize(It.IsAny<DirectoryInfo>()))
            .Returns<DirectoryInfo>(d => d.Name == "AlphaDir" ? 123L : 0L);

        var controller = CreateController(sizeProvider.Object);

        // Act
        var result = controller.Search("alp"); // should match "AlphaDir" and "alpha.txt"

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsAssignableFrom<IEnumerable<FormattedFileInfo>>(ok.Value);
        var list = payload.ToList();

        // Expect exactly two results: one dir, one file
        Assert.Equal(2, list.Count);

        var dirResult = Assert.Single(list.Where(x => x.IsDirectory));
        Assert.Equal("AlphaDir", dirResult.Name);
        Assert.Equal(123L, dirResult.Size);

        var fileResult = Assert.Single(list.Where(x => !x.IsDirectory));
        Assert.Equal("alpha.txt", fileResult.Name);
        Assert.Equal(new FileInfo(alphaFilePath).Length, fileResult.Size);

        // Ensure non-matching file is not present
        Assert.DoesNotContain(list, x => x.Name == "beta.txt");
    }
}
