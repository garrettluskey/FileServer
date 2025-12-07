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
function buildFilesUrlForPath(prefix: string, path?: string, ): string {
    const effectivePath = (path ?? getCurrentPath()) || "/";

    if (effectivePath === "/" || effectivePath === "") {
        // Root directory
        return `${prefix}/`;
    }

    // Trim leading slash for routing and URL-encode segments
    const trimmed = effectivePath.startsWith("/") ? effectivePath.substring(1) : effectivePath;
    const encoded = trimmed.split("/").map(encodeURIComponent).join("/");

    return `${prefix}/${encoded}`;
}

/**
 * List files/directories in a directory.
 * If `path` is omitted, it uses the current hash-based path.
 */
export async function getFiles(): Promise<FileInfoModel[]> {
    const url = buildFilesUrlForPath(FILES_BASE_URL);

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
    const url = buildFilesUrlForPath(FILES_BASE_URL) + '/' + name;

    console.log(url)

    const response = await fetch(url, {
        method: "DELETE"
    });

    if (!response.ok) {
        console.error("Failed to delete entry:", response.status, response.statusText);
        return false;
    }

    document.dispatchEvent(new Event("files-updated"));

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
    const url = buildFilesUrlForPath(FILES_BASE_URL, directoryPath);

    console.log(`Uploading to ${url}`)

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        console.error("Failed to upload file:", response.status, response.statusText);
        return null;
    }

    document.dispatchEvent(new Event("files-updated"));

    return (await response.json()) as UploadResult;
}

export async function downloadFile(fileName: string) : Promise<Blob | null>
{
    const url = buildFilesUrlForPath("download") + '/' + fileName;

    console.log(url)

    const response = await fetch(url);

    if (!response.ok) {
        console.error("Failed to fetch files:", response.status, response.statusText);
        return null;
    }

    return await response.blob();
}