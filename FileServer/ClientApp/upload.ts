// upload.ts

// The backend upload endpoint
const UPLOAD_URL = "/files";

function initUploadButton() {
    const uploadBtn = document.getElementById("upload-btn") as HTMLButtonElement | null;

    if (!uploadBtn) {
        console.error("Upload button not found!");
        return;
    }

    // Build URL: /files/ for root, /files/{directory} for a subdirectory
    

    uploadBtn.addEventListener("click", async () => {

        // Create a hidden file input dynamically
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;         // allow multiple files
        input.style.display = "none";

        document.body.appendChild(input);

        input.addEventListener("change", async () => {
            if (!input.files || input.files.length === 0) {
                document.body.removeChild(input);
                return;
            }

            const formData = new FormData();
            for (const file of input.files) {
                formData.append("files", file);
            }

            try {
                const response = await fetch(UPLOAD_URL, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }

                console.log("Upload complete!");
                // Optional: trigger refresh event
                document.dispatchEvent(new Event("files-updated"));
            } catch (err) {
                console.error("Upload error:", err);
            }

            document.body.removeChild(input);
        });

        // Simulate clicking the file dialog
        input.click();
    });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initUploadButton);
