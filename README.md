# File Server (ASP.NET Core + TypeScript)

A lightweight file browser and file management web application built with **ASP.NET Core**, **TypeScript**, and **vanilla JavaScript**.

Features include:

- Browsing directories and files under a configurable root
- Uploading files
- Deleting files
- Recursive directory size calculation
- Full-text search across all files and folders

---

## Pre-requisites

Before running or developing this project, ensure the following tools are installed:

### 1. .NET SDK

- **.NET 8** or **.NET 9 Preview**
- Download: https://dotnet.microsoft.com/download

### 2. Node.js + npm

Used for TypeScript compilation.

- Recommended: **Node 18+**
- Download: https://nodejs.org/

### 3. TypeScript

If not already installed globally:

```bash
npm install -g typescript
````

> Alternatively, you can use the local `typescript` dependency via `npx tsc` if you prefer not to install it globally.

### 4. IDE / Editor

* Recommended: **Visual Studio 2022** (for full ASP.NET debugging support)
* Alternative: **VS Code** (works well for TypeScript and front-end development)

Visual Studio 2022 download:
[https://visualstudio.microsoft.com/vs/older-downloads/#visual-studio-2022-and-other-products](https://visualstudio.microsoft.com/vs/older-downloads/#visual-studio-2022-and-other-products)

---

## Setup

By default, the `./SampleData` directory is used as the web server’s root directory.

This is configured via the `BROWSER_ROOT_DIR` environment variable in `launchSettings.json`:

```jsonc
"environmentVariables": {
  "BROWSER_ROOT_DIR": "./SampleData"
}
```

To point the file server at a different directory, update `BROWSER_ROOT_DIR` to your desired path.

Example:

```jsonc
"environmentVariables": {
  "BROWSER_ROOT_DIR": "C:\\Data\\Files"
}
```

---

## Building the TypeScript

From the appropriate project folder (for example, `ClientApp` if that’s where your TS lives):

```bash
npm install
npx tsc --watch
```

Or, if you installed TypeScript globally:

```bash
tsc --watch
```

> Visual Studio can also be configured to build TypeScript on save using the project’s `tsconfig.json`.

---

## Running the Application (without Docker)

From the solution directory:

```bash
dotnet restore
dotnet build
dotnet run --project FileServer/FileServer.csproj
```

By default, the app will listen on the URLs configured in `launchSettings.json` (for example):

* HTTP: `http://localhost:5255`
* HTTPS: `https://localhost:7071`

Open the root URL in your browser and you should see the file browser UI.

---

## Debugging in Visual Studio

The following launch profiles are available in Visual Studio:

* **IIS Express**
  Runs the application behind IIS Express with the configured environment variables.

* **http**
  Runs Kestrel on the configured HTTP URL (for example `http://localhost:5255`).

* **https**
  Runs Kestrel on HTTPS (for example `https://localhost:7071`) and optionally HTTP as well.

* **Container (Dockerfile)**
  Runs the application inside a Docker container defined by the project’s `Dockerfile`.

Choose the desired profile from the Visual Studio dropdown and press **F5** to start debugging.

---

## Running in Docker (optional)

If you have Docker installed and a `Container (Dockerfile)` profile configured, you can also build and run the container manually:

```bash
docker build -t fileserver .
docker run --rm -p 8080:8080 -e BROWSER_ROOT_DIR=/app/data fileserver
```

If your Docker configuration mounts `./SampleData` into `/app/data`, the container will serve those files.

Then open:

* `http://localhost:8080`

to access the file browser running inside the container.