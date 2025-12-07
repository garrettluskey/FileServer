"use strict";
// upload.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// The backend upload endpoint
const UPLOAD_URL = "/files";
function initUploadButton() {
    const uploadBtn = document.getElementById("upload-btn");
    if (!uploadBtn) {
        console.error("Upload button not found!");
        return;
    }
    // Build URL: /files/ for root, /files/{directory} for a subdirectory
    uploadBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        // Create a hidden file input dynamically
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true; // allow multiple files
        input.style.display = "none";
        document.body.appendChild(input);
        input.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
            if (!input.files || input.files.length === 0) {
                document.body.removeChild(input);
                return;
            }
            const formData = new FormData();
            for (const file of input.files) {
                formData.append("files", file);
            }
            try {
                const response = yield fetch(UPLOAD_URL, {
                    method: "POST",
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }
                console.log("Upload complete!");
                // Optional: trigger refresh event
                document.dispatchEvent(new Event("files-updated"));
            }
            catch (err) {
                console.error("Upload error:", err);
            }
            document.body.removeChild(input);
        }));
        // Simulate clicking the file dialog
        input.click();
    }));
}
// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initUploadButton);
//# sourceMappingURL=upload.js.map