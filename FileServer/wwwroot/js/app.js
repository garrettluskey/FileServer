"use strict";
const testData = [
    { name: "README.md", type: "file" },
    { name: "documents", type: "folder" },
    { name: "photo.png", type: "file" },
    { name: "projects", type: "folder" }
];
function populateGrid(items) {
    const grid = document.getElementById("file-grid");
    const template = document.getElementById("file-row-template");
    if (!grid || !template) {
        console.error("Missing grid or template element.");
        return;
    }
    for (const item of items) {
        const clone = template.content.cloneNode(true);
        const row = clone.querySelector(".file-grid-row");
        const nameSpan = clone.querySelector(".file-name");
        const typeSpan = clone.querySelector(".file-type");
        const deleteBtn = clone.querySelector(".file-delete");
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
//# sourceMappingURL=app.js.map