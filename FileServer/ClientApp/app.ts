import { FileSizeFormatter } from "./FileSizeFormatter.js";

// Matches the C# FormattedFileInfo struct as serialized by ASP.NET
interface FormattedFileInfo {
    isDirectory: boolean;
    name: string;
    size: number;
}

const FILES_BASE_URL = "/files";

// If you eventually support subdirectories, you can track it here
let currentDirectory: string | null = null;

async function loadAndPopulateGrid(directory: string | null = null): Promise<void> {
    const grid = document.getElementById("file-grid");
    const template = document.getElementById("file-row-template") as HTMLTemplateElement;

    if (!grid || !template) {
        console.error("Missing grid or template element.");
        return;
    }

    // Build URL: /files/ for root, /files/{directory} for a subdirectory
    const url =
        directory && directory.length > 0
            ? `${FILES_BASE_URL}/${encodeURIComponent(directory)}`
            : FILES_BASE_URL;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error("Failed to fetch files:", response.status, response.statusText);
            return;
        }

        const items = (await response.json()) as FormattedFileInfo[];

        // Clear existing rows except the header
        const existingRows = grid.querySelectorAll(".file-grid-row:not(.file-grid-header)");
        existingRows.forEach(row => row.remove());

        for (const item of items) {
            const clone = template.content.cloneNode(true) as HTMLElement;

            const row = clone.querySelector(".file-grid-row") as HTMLElement;
            const nameSpan = clone.querySelector(".file-name") as HTMLElement;
            const typeSpan = clone.querySelector(".file-type") as HTMLElement;
            const sizeSpan = clone.querySelector(".file-size") as HTMLElement;
            const deleteBtn = clone.querySelector(".file-delete") as HTMLButtonElement;

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
    } catch (err) {
        console.error("Error while loading files:", err);
    }
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
