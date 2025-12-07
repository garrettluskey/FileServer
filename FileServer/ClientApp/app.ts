import formatFileSize from "./formatFileSize.js";

// Matches the C# FormattedFileInfo struct as serialized by ASP.NET
interface FormattedFileInfo {
    isDirectory: boolean;
    name: string;
    size: number;
}

const FILES_BASE_URL = "/files";

async function loadAndPopulateGrid(): Promise<void> {
    const grid = document.getElementById("file-grid");
    const template = document.getElementById("file-row-template") as HTMLTemplateElement;

    if (!grid || !template) {
        console.error("Missing grid or template element.");
        return;
    }

    // Build URL: /files/ for root, /files/{directory} for a subdirectory
    const url = FILES_BASE_URL + window.location.hash.substring(1)

    console.log(url)

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

        function getParentPath(current: string): string {
            current = current.replace(/^\/|#/g, ""); // remove leading slash/hash

            if (current === "") return "/";

            const parts = current.split("/").filter(Boolean);
            parts.pop();

            return parts.length > 0 ? "/" + parts.join("/") : "/";
        }

        const currentPath = window.location.hash.substring(1)

        if (currentPath !== "/")
        {
            const clone = template.content.cloneNode(true) as HTMLElement;

            const row = clone.querySelector(".file-grid-row") as HTMLElement;
            const nameSpan = clone.querySelector(".file-name") as HTMLElement;
            const typeSpan = clone.querySelector(".file-type") as HTMLElement;

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
