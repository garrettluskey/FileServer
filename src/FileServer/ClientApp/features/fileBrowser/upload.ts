// upload.ts

import { uploadFile } from "../../services/file-service.js";

export default function renderUploadButton() {
    const uploadBtn = document.getElementById("upload-btn") as HTMLButtonElement | null;

    if (!uploadBtn) {
        console.error("Upload button not found!");
        return;
    }

    uploadBtn.addEventListener("click", async () => {

        // Create a hidden file input dynamically
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = false;
        input.style.display = "none";

        document.body.appendChild(input);

        input.addEventListener("change", async () => {
            if (!input.files || input.files.length === 0) {
                document.body.removeChild(input);
                return;
            }

            // Upload ONLY the first file
            await uploadFile(input.files[0]);

            document.body.removeChild(input);
        });

        input.click(); // open file picker
    });
}