import type { FormattedFileInfo } from "../models/file-info.js";
import { getCurrentPath } from "../shared/directoryHelper.js";

const API_VERSION = 1;
const API_BASE_URL = `/api/v${API_VERSION}`
const FILES_BASE_URL = API_BASE_URL + "/files";

const DOWNLOAD_BASE_URL = FILES_BASE_URL + "/download";
const SEARCH_BASE_URL = FILES_BASE_URL + "/search";

export interface UploadResult {
    fileName: string;
    relativePath: string;
    size: number;
}

/**
 * Build a base URL for a given logical path under a specific prefix.
 *
 * - `prefix` is the API base (e.g. "/files" or "/download").
 * - `path` is the logical directory path (e.g. "/foo/bar").
 *   If omitted, the current directory from the URL hash is used.
 */
function buildFilesUrlForPath(prefix: string, path?: string): string {
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
 * Utility to safely append a path segment to a base URL.
 */
function appendSegment(baseUrl: string, segment: string): string {
    const encoded = encodeURIComponent(segment);
    const separator = baseUrl.endsWith("/") ? "" : "/";
    return `${baseUrl}${separator}${encoded}`;
}

/**
 * List files/directories in a directory.
 * If `directoryPath` is omitted, it uses the current hash-based path.
 */
export async function getFiles(directoryPath?: string): Promise<FormattedFileInfo[]> {
    const url = buildFilesUrlForPath(FILES_BASE_URL, directoryPath);

    const response = await fetch(url);

    if (!response.ok) {
        console.error("Failed to fetch files:", response.status, response.statusText);
        return [];
    }

    return (await response.json()) as FormattedFileInfo[];
}

/**
 * Searches the file system for a given file.
 *
 * @param query Query to use to search for files.
 */
export async function searchFiles(): Promise<FormattedFileInfo[]> {
    const url = API_BASE_URL + window.location.hash.substring(1);

    console.log(url)

    const response = await fetch(url);

    if (!response.ok) {
        console.error("Failed to search files:", response.status, response.statusText);
        return [];
    }

    return (await response.json()) as FormattedFileInfo[];
}

/**
 * Delete a file or directory (recursive on the server).
 *
 * @param name Name of the entry to delete (e.g. "foo.txt" or "subdir").
 * @param directoryPath Optional directory containing the entry.
 *                      Defaults to the current path.
 */
export async function deleteEntry(
    name: string,
    directoryPath?: string
): Promise<boolean> {
    const baseUrl = buildFilesUrlForPath(FILES_BASE_URL, directoryPath);
    const url = appendSegment(baseUrl, name);

    console.log("Deleting:", url);

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
 * Upload a single file into the given directory.
 *
 * @param file The File from an <input type="file"> element.
 * @param directoryPath Optional target directory. Defaults to current path.
 */
export async function uploadFile(
    file: File,
    directoryPath?: string
): Promise<UploadResult | null> {
    const url = buildFilesUrlForPath(FILES_BASE_URL, directoryPath);

    console.log(`Uploading to ${url}`);

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

/**
 * Download a file as a Blob from the given directory.
 *
 * @param name File name (e.g. "foo.txt").
 * @param directoryPath Optional directory containing the file.
 *                      Defaults to the current path.
 */
export async function downloadFile(
    name: string,
    directoryPath?: string
): Promise<Blob | null> {
    const baseUrl = buildFilesUrlForPath(DOWNLOAD_BASE_URL, directoryPath);
    const url = appendSegment(baseUrl, name);

    console.log("Downloading:", url);

    const response = await fetch(url);

    if (!response.ok) {
        console.error("Failed to download file:", response.status, response.statusText);
        return null;
    }

    return await response.blob();
}
