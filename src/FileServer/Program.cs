using FileServer.Services.DirectorySizeService;
using FileServer.Services.FileSize;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

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

// Prepend "/api" and version to API urls
var api = app.MapGroup("/api");
api.MapControllers();

app.UseRouting();

// Serve web pages
app.UseFileServer();

app.Run();
