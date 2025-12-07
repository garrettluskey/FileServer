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
import { uploadFile } from "./services/file-service.js";
function initUploadButton() {
    const uploadBtn = document.getElementById("upload-btn");
    if (!uploadBtn) {
        console.error("Upload button not found!");
        return;
    }
    uploadBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        // Create a hidden file input dynamically
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = false;
        input.style.display = "none";
        document.body.appendChild(input);
        input.addEventListener("change", () => __awaiter(this, void 0, void 0, function* () {
            if (!input.files || input.files.length === 0) {
                document.body.removeChild(input);
                return;
            }
            // Upload ONLY the first file
            yield uploadFile(input.files[0]);
            document.body.removeChild(input);
        }));
        input.click(); // open file picker
    }));
}
// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initUploadButton);
//# sourceMappingURL=upload.js.map