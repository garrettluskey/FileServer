var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCurrentPath } from "../directoryHelper.js";
const FILES_BASE_URL = "/files";
/**
 * Build a /files URL for a given logical path.
 * If no path is supplied, uses the current directory from the URL hash.
 */
function buildFilesUrlForPath(path) {
    const effectivePath = (path !== null && path !== void 0 ? path : getCurrentPath()) || "/";
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
export function getFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = buildFilesUrlForPath();
        const response = yield fetch(url);
        if (!response.ok) {
            console.error("Failed to fetch files:", response.status, response.statusText);
            return [];
        }
        return (yield response.json());
    });
}
/**
 * Delete a file or directory (recursive on the server).
 *
 * @param name Name of the entry to delete (e.g. "foo.txt" or "subdir").
 * @param directoryPath Optional directory containing the entry.
 *                       Defaults to the current path.
 */
export function deleteEntry(name, directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let basePath = (directoryPath !== null && directoryPath !== void 0 ? directoryPath : getCurrentPath()) || "/";
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
        const response = yield fetch(url, {
            method: "DELETE"
        });
        if (!response.ok) {
            console.error("Failed to delete entry:", response.status, response.statusText);
            return false;
        }
        return true;
    });
}
/**
 * Upload a files into the given directory.
 *
 * @param files The FileList from an <input type="file"> element.
 * @param directoryPath Optional target directory. Defaults to current path.
 */
export function uploadFile(file, directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = buildFilesUrlForPath(directoryPath);
        console.log(`Uploading to ${url}`);
        const formData = new FormData();
        formData.append("files", file);
        const response = yield fetch(url, {
            method: "POST",
            body: formData
        });
        if (!response.ok) {
            console.error("Failed to upload file:", response.status, response.statusText);
            return null;
        }
        return (yield response.json());
    });
}
//# sourceMappingURL=file-service.js.map