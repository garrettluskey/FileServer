interface FileItem {
    name: string;
    type: "file" | "folder";
}

const testData: FileItem[] = [
    { name: "README.md", type: "file" },
    { name: "documents", type: "folder" },
    { name: "photo.png", type: "file" },
    { name: "projects", type: "folder" }
];

function populateGrid(items: FileItem[]) {
    const grid = document.getElementById("file-grid");
    const template = document.getElementById("file-row-template") as HTMLTemplateElement;

    if (!grid || !template) {
        console.error("Missing grid or template element.");
        return;
    }

    for (const item of items) {
        const clone = template.content.cloneNode(true) as HTMLElement;

        const row = clone.querySelector(".file-grid-row") as HTMLElement;
        const nameSpan = clone.querySelector(".file-name") as HTMLElement;
        const typeSpan = clone.querySelector(".file-type") as HTMLElement;
        const deleteBtn = clone.querySelector(".file-delete") as HTMLButtonElement;

        // Name cell: inject icon + text
        nameSpan.textContent = item.name;

        // Type cell
        typeSpan.textContent = item.type === "folder" ? "📁" : "📄";

        // Store path
        row.dataset.path = item.name;

        // Delete handler
        deleteBtn.addEventListener("click", () => {
            console.log("Delete clicked:", item.name);
            row.remove();
        });

        grid.appendChild(clone);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    populateGrid(testData);
});
