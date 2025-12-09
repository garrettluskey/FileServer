var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { deleteEntry, downloadFile, getFiles, searchFiles } from "../../services/file-service.js";
import { getCurrentPath, getParentPath } from "../../shared/directory-helper.js";
import formatFileSize from "../../shared/format-file-size.js";
import renderSearchBox from "./search.js";
import renderUploadButton from "./upload.js";
function renderFileBrowser(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const grid = document.getElementById("file-grid");
        if (!grid) {
            console.error("Missing grid or template element.");
            return;
        }
        try {
            // Clear existing rows except the header
            const existingRows = grid.querySelectorAll(".file-grid-row:not(.file-grid-header)");
            existingRows.forEach(row => row.remove());
            const currentPath = getCurrentPath();
            const rootPaths = new Set(["/", ""]);
            const rootLink = createRootLink();
            grid.appendChild(rootLink);
            // Only add parent link ".." if we are not in a root path
            if (!rootPaths.has(currentPath) && !isSearchRoute()) {
                const parentLink = createParentLink();
                grid.appendChild(parentLink);
            }
            for (const file of files) {
                const row = createFileRow(file, getCurrentPath());
                grid.appendChild(row);
            }
        }
        catch (err) {
            console.error("Error while loading files:", err);
        }
    });
}
function createRootLink() {
    const template = document.getElementById("file-row-template");
    const fragment = template.content.cloneNode(true);
    const nameSpan = fragment.querySelector(".file-name");
    const typeSpan = fragment.querySelector(".file-type");
    const deleteBtn = fragment.querySelector(".file-delete");
    deleteBtn.remove();
    // Clear name span and insert a hyperlink
    nameSpan.textContent = "";
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "/";
    link.classList.add("file-up-link");
    nameSpan.appendChild(link);
    typeSpan.textContent = "🏠";
    return fragment;
}
function createParentLink() {
    const template = document.getElementById("file-row-template");
    const fragment = template.content.cloneNode(true);
    const nameSpan = fragment.querySelector(".file-name");
    const typeSpan = fragment.querySelector(".file-type");
    const deleteBtn = fragment.querySelector(".file-delete");
    deleteBtn.remove();
    // Clear name span and insert a hyperlink
    nameSpan.textContent = "";
    const link = document.createElement("a");
    link.href = "#" + getParentPath();
    link.textContent = "..";
    link.classList.add("file-up-link");
    nameSpan.appendChild(link);
    typeSpan.textContent = "↰";
    return fragment;
}
function createFileRow(item, currentPath) {
    const template = document.getElementById("file-row-template");
    const fragment = template.content.cloneNode(true);
    const row = fragment.querySelector(".file-grid-row");
    const link = fragment.querySelector(".file-link");
    const typeSpan = fragment.querySelector(".file-type");
    const sizeSpan = fragment.querySelector(".file-size");
    const deleteBtn = fragment.querySelector(".file-delete");
    // Build full path (e.g. /docs/file.txt)
    const fullPath = currentPath.endsWith("/")
        ? currentPath + item.name
        : currentPath + "/" + item.name;
    // Set dataset attributes
    row.dataset.path = fullPath;
    row.dataset.isDirectory = String(item.isDirectory);
    // Setup link
    link.textContent = item.name;
    if (item.isDirectory) {
        link.href = "#" + fullPath;
    }
    else {
        // For files, attach a click handler that starts a download
        link.href = "#"; // Prevent default navigation
        link.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const blob = yield downloadFile(item.name);
            if (blob == null)
                return;
            // Create a temporary URL for the blob
            const blobUrl = URL.createObjectURL(blob);
            // Create a hidden <a> element
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = item.name; // Suggests the filename to the browser
            // Add to DOM, trigger click, then remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Clean up object URL
            URL.revokeObjectURL(blobUrl);
        }));
    }
    // Type
    typeSpan.textContent = item.isDirectory ? "📁" : "📄";
    // Size
    sizeSpan.textContent = formatFileSize(item.size);
    // Delete Button
    deleteBtn.dataset.path = fullPath;
    deleteBtn.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
        yield deleteEntry(item.name);
    }));
    return fragment;
}
function renderFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield getFiles();
        renderFileBrowser(files);
    });
}
function isSearchRoute() {
    const path = getCurrentPath().split("?")[0];
    console.log(path);
    return path.startsWith("/files/search");
}
export default function initFileBrowser() {
    window.addEventListener("hashchange", () => __awaiter(this, void 0, void 0, function* () {
        if (isSearchRoute()) {
            var files = yield searchFiles();
            yield renderFileBrowser(files);
            return;
        }
        yield renderFiles();
    }));
    // Auto refresh on local file update
    document.addEventListener("files-updated", renderFiles);
}
document.addEventListener("DOMContentLoaded", () => {
    // initial load for root: /files/
    renderFiles();
    renderSearchBox();
    renderUploadButton();
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            renderFiles();
        });
    }
});
