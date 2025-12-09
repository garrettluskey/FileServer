var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function renderSearchBox() {
    const input = document.getElementById("search-box");
    const button = document.getElementById("search-btn");
    if (!input || !button) {
        console.error("Search UI elements missing.");
        return;
    }
    function executeSearch() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = input.value.trim();
            // If empty, do nothing
            if (query.length === 0) {
                return;
            }
            // Build URL: /search?query=...
            const encoded = encodeURIComponent(query);
            const url = `#/files/search?query=${encoded}`;
            // Navigate
            window.location.href = url;
        });
    }
    // Click handler
    button.addEventListener("click", executeSearch);
    // Press Enter inside the box
    input.addEventListener("keydown", (e) => __awaiter(this, void 0, void 0, function* () {
        if (e.key === "Enter") {
            yield executeSearch();
        }
    }));
}
// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", renderSearchBox);
