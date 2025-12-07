export class FileSizeFormatter {
    static formatSize(size) {
        if (size < 1024)
            return `${size} B`;
        if (size < 1 << 20)
            return this.formatScaled(size, 1024, "KB"); // < 1 MB
        if (size < 1 << 30)
            return this.formatScaled(size, 1 << 20, "MB"); // < 1 GB
        if (size < 1 << 40)
            return this.formatScaled(size, 1 << 30, "GB"); // < 1 TB
        if (size < 1 << 50)
            return this.formatScaled(size, 1 << 40, "TB"); // < 1 PB
        if (size < 1 << 60)
            return this.formatScaled(size, 1 << 50, "PB"); // < 1 EB
        return this.formatScaled(size, 1 << 60, "EB"); // ≥ 1 EB
    }
    static formatScaled(size, divisor, unit) {
        const value = size / divisor;
        return `${value.toFixed(1)} ${unit}`;
    }
}
//# sourceMappingURL=FileSizeFormatter.js.map