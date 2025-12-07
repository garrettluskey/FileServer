var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import formatFileSize from "./formatFileSize.js";
const FILES_BASE_URL = "/files";
function loadAndPopulateGrid() {
    return __awaiter(this, void 0, void 0, function* () {
        const grid = document.getElementById("file-grid");
        const template = document.getElementById("file-row-template");
        if (!grid || !template) {
            console.error("Missing grid or template element.");
            return;
        }
        // Build URL: /files/ for root, /files/{directory} for a subdirectory
        const url = FILES_BASE_URL + window.location.hash.substring(1);
        console.log(url);
        try {
            const response = yield fetch(url);
            if (!response.ok) {
                console.error("Failed to fetch files:", response.status, response.statusText);
                return;
            }
            const items = (yield response.json());
            // Clear existing rows except the header
            const existingRows = grid.querySelectorAll(".file-grid-row:not(.file-grid-header)");
            existingRows.forEach(row => row.remove());
            function getParentPath(current) {
                current = current.replace(/^\/|#/g, ""); // remove leading slash/hash
                if (current === "")
                    return "/";
                const parts = current.split("/").filter(Boolean);
                parts.pop();
                return parts.length > 0 ? "/" + parts.join("/") : "/";
            }
            const currentPath = window.location.hash.substring(1);
            if (currentPath !== "/") {
                const clone = template.content.cloneNode(true);
                const row = clone.querySelector(".file-grid-row");
                const nameSpan = clone.querySelector(".file-name");
                const typeSpan = clone.querySelector(".file-type");
                // Clear name span and insert a hyperlink
                nameSpan.textContent = "";
                const link = document.createElement("a");
                const parentPath = getParentPath(currentPath);
                link.href = "#" + parentPath;
                link.textContent = "..";
                link.classList.add("file-up-link");
                nameSpan.appendChild(link);
                typeSpan.textContent = "↰";
                grid.appendChild(clone);
            }
            for (const item of items) {
                const row = createFileRow(item, currentPath);
                grid.appendChild(row);
            }
        }
        catch (err) {
            console.error("Error while loading files:", err);
        }
    });
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
    link.href = "#" + fullPath;
    // Type
    typeSpan.textContent = item.isDirectory ? "📁" : "📄";
    // Size
    sizeSpan.textContent = formatFileSize(item.size);
    // Delete Button
    deleteBtn.dataset.path = fullPath;
    return row;
}
// Wire up initial load + refresh button
document.addEventListener("DOMContentLoaded", () => {
    // initial load for root: /files/
    loadAndPopulateGrid();
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadAndPopulateGrid();
        });
    }
});
window.addEventListener("hashchange", loadAndPopulateGrid);
// Auto refresh on local file update
document.addEventListener("files-updated", loadAndPopulateGrid);
//# sourceMappingURL=app.js.map