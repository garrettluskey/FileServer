export function getParentPath() {
    const current = getCurrentPath().replace(/^\/|#/g, ""); // remove leading slash/hash
    if (current === "")
        return "/";
    const parts = current.split("/").filter(Boolean);
    parts.pop();
    return parts.length > 0 ? "/" + parts.join("/") : "/";
}
export function getCurrentPath() {
    return window.location.hash.substring(1);
}
