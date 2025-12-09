import { searchFiles } from "../../services/file-service.js";

export default function renderSearchBox(): void {
    const input = document.getElementById("search-box") as HTMLInputElement | null;
    const button = document.getElementById("search-btn") as HTMLButtonElement | null;

    if (!input || !button) {
        console.error("Search UI elements missing.");
        return;
    }

    async function executeSearch(): Promise<void> {
        const query = input!.value.trim();

        // If empty, do nothing
        if (query.length === 0) {
            return;
        }

        // Build URL: /search?query=...
        const encoded = encodeURIComponent(query);
        const url = `#/files/search?query=${encoded}`;

        // Navigate
        window.location.href = url;
    }

    // Click handler
    button.addEventListener("click", executeSearch);

    // Press Enter inside the box
    input.addEventListener("keydown", async (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            await executeSearch();
        }
    });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", renderSearchBox);
