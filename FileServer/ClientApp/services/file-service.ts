import { getCurrentPath } from "../directoryHelper.js";
import type { FileInfoModel } from "../models/file-info.js";

const FILES_BASE_URL = "/files";

export interface UploadResult {
    fileName: string;
    relativePath: string;
    size: number;
}

/**
 * Build a /files URL for a given logical path.
 * If no path is supplied, uses the current directory from the URL hash.
 */
function buildFilesUrlForPath(path?: string): string {
    const effectivePath = (path ?? getCurrentPath()) || "/";

    if (effectivePath === "/" || effectivePath === "") {
        // Root directory
        return `${FILES_BASE_URL}/`;
    }

    // Trim leading slash for routing and URL-encode segments
    const trimmed = effectivePath.startsWith("/") ? effectivePath.substring(1) : effectivePath;
    const encoded = trimmed.split("/").map(encodeURIComponent).join("/");

    return `${FILES_BASE_URL}/${encoded}`;
}

/**
 * List files/directories in a directory.
 * If `path` is omitted, it uses the current hash-based path.
 */
export async function getFiles(): Promise<FileInfoModel[]> {
    const url = buildFilesUrlForPath();

    const response = await fetch(url);

    if (!response.ok) {
        console.error("Failed to fetch files:", response.status, response.statusText);
        return [];
    }

    return (await response.json()) as FileInfoModel[];
}

/**
 * Delete a file or directory (recursive on the server).
 *
 * @param name Name of the entry to delete (e.g. "foo.txt" or "subdir").
 * @param directoryPath Optional directory containing the entry.
 *                       Defaults to the current path.
 */
export async function deleteEntry(
    name: string,
    directoryPath?: string
): Promise<boolean> {
    let basePath = (directoryPath ?? getCurrentPath()) || "/";

    // Normalize base path
    if (!basePath.startsWith("/")) {
        basePath = "/" + basePath;
    }
    if (basePath.endsWith("/") && basePath !== "/") {
        basePath = basePath.slice(0, -1);
    }

    // For root, just use "/name"; otherwise "/dir/name"
    const fullPath = basePath === "/" ? `/${name}` : `${basePath}/${name}`;

    const url = buildFilesUrlForPath(fullPath);

    const response = await fetch(url, {
        method: "DELETE"
    });

    if (!response.ok) {
        console.error("Failed to delete entry:", response.status, response.statusText);
        return false;
    }

    return true;
}

/**
 * Upload a files into the given directory.
 *
 * @param files The FileList from an <input type="file"> element.
 * @param directoryPath Optional target directory. Defaults to current path.
 */
export async function uploadFile(
    file: File,
    directoryPath?: string
): Promise<UploadResult | null> {
    const url = buildFilesUrlForPath(directoryPath);

    console.log(`Uploading to ${url}`)

    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        console.error("Failed to upload file:", response.status, response.statusText);
        return null;
    }

    return (await response.json()) as UploadResult;
}