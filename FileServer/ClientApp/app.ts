import { getCurrentPath, getParentPath } from "./directoryHelper.js";
import formatFileSize from "./formatFileSize.js";
import { getFiles } from "./services/file-service.js";

// Matches the C# FormattedFileInfo struct as serialized by ASP.NET
interface FormattedFileInfo {
    isDirectory: boolean;
    name: string;
    size: number;
}



async function loadAndPopulateGrid(): Promise<void> {
    const grid = document.getElementById("file-grid");
    const template = document.getElementById("file-row-template") as HTMLTemplateElement;

    if (!grid || !template) {
        console.error("Missing grid or template element.");
        return;
    }

    try {
        const items = await getFiles();

        // Clear existing rows except the header
        const existingRows = grid.querySelectorAll(".file-grid-row:not(.file-grid-header)");
        existingRows.forEach(row => row.remove());

        if (getCurrentPath() !== "/")
        {
            const clone = template.content.cloneNode(true) as HTMLElement;

            const row = clone.querySelector(".file-grid-row") as HTMLElement;
            const nameSpan = clone.querySelector(".file-name") as HTMLElement;
            const typeSpan = clone.querySelector(".file-type") as HTMLElement;
            const deleteBtn = clone.querySelector(".file-delete") as HTMLElement;

            deleteBtn.remove();
            

            // Clear name span and insert a hyperlink
            nameSpan.textContent = "";
            const link = document.createElement("a");

            link.href = "#" + getParentPath();
            link.textContent = "..";
            link.classList.add("file-up-link");

            nameSpan.appendChild(link);

            typeSpan.textContent = "↰";

            grid.appendChild(clone);
        }

        for (const item of items) {
            
            const row = createFileRow(item, getCurrentPath());

            grid.appendChild(row);
        }
    } catch (err) {
        console.error("Error while loading files:", err);
    }
}

interface FormattedFileInfo {
    isDirectory: boolean;
    name: string;
    size: number;
}

function createFileRow(item: FormattedFileInfo, currentPath: string): HTMLElement {
    const template = document.getElementById("file-row-template") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;

    const row = fragment.querySelector(".file-grid-row") as HTMLElement;
    const link = fragment.querySelector(".file-link") as HTMLAnchorElement;
    const typeSpan = fragment.querySelector(".file-type") as HTMLElement;
    const sizeSpan = fragment.querySelector(".file-size") as HTMLElement;
    const deleteBtn = fragment.querySelector(".file-delete") as HTMLButtonElement;

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
    } else {
        // TODO setup download file
    }

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
