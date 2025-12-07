using FileServer.Services.DirectorySizeService;
using FileServer.Services.FileSize;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddBasePathService();
builder.Services.AddDirectorySizeCache();
builder.Services.AddFileSizeService();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Serve web pages
app.UseFileServer();
app.UseRouting();

app.Run();
