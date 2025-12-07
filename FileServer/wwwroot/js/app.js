var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FileSizeFormatter } from "./FileSizeFormatter.js";
const FILES_BASE_URL = "/files";
// If you eventually support subdirectories, you can track it here
let currentDirectory = null;
function loadAndPopulateGrid() {
    return __awaiter(this, arguments, void 0, function* (directory = null) {
        const grid = document.getElementById("file-grid");
        const template = document.getElementById("file-row-template");
        if (!grid || !template) {
            console.error("Missing grid or template element.");
            return;
        }
        // Build URL: /files/ for root, /files/{directory} for a subdirectory
        const url = directory && directory.length > 0
            ? `${FILES_BASE_URL}/${encodeURIComponent(directory)}`
            : FILES_BASE_URL;
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
            for (const item of items) {
                const clone = template.content.cloneNode(true);
                const row = clone.querySelector(".file-grid-row");
                const nameSpan = clone.querySelector(".file-name");
                const typeSpan = clone.querySelector(".file-type");
                const sizeSpan = clone.querySelector(".file-size");
                const deleteBtn = clone.querySelector(".file-delete");
                // Name cell: icon + file/folder name
                nameSpan.textContent = item.name;
                // Type cell: user-facing text
                typeSpan.textContent = item.isDirectory ? "📁" : "📄";
                sizeSpan.textContent = FileSizeFormatter.formatSize(item.size);
                // Data-path for later use (e.g. navigation or delete)
                row.dataset.path = item.name;
                // Example delete handler (client-side only)
                deleteBtn.addEventListener("click", () => {
                    console.log("Delete clicked:", item.name);
                    row.remove();
                });
                grid.appendChild(clone);
            }
        }
        catch (err) {
            console.error("Error while loading files:", err);
        }
    });
}
// Wire up initial load + refresh button
document.addEventListener("DOMContentLoaded", () => {
    // initial load for root: /files/
    loadAndPopulateGrid(currentDirectory);
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadAndPopulateGrid(currentDirectory);
        });
    }
});
//# sourceMappingURL=app.js.map