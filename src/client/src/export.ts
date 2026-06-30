function escapeCsvCell(value: unknown): string {
    const normalized = Array.isArray(value)
        ? value.join(" | ")
        : value && typeof value === "object"
            ? JSON.stringify(value)
            : String(value ?? "");
    const escaped = normalized.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function recordsToCsv(records: Array<Record<string, unknown>>): string {
    if (records.length === 0) {
        return "";
    }

    const headers: string[] = [];
    for (const record of records) {
        for (const key of Object.keys(record)) {
            if (!headers.includes(key)) {
                headers.push(key);
            }
        }
    }

    const rows = records.map((record) => headers.map((header) => escapeCsvCell(record[header])).join(","));
    return [headers.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}