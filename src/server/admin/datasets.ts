import { datasetUrl, loadDataset, saveDataset } from "../datasets/loader.ts";
import { datasetDefinitions, getDatasetDefinition } from "../meta/catalog.ts";
import { ServiceError } from "../validation/errors.ts";

type DatasetEntry = string | number | boolean | Record<string, unknown> | string[];

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateFieldValue(field: { name: string; type: string; required?: boolean; options?: readonly string[] }, value: unknown): void {
    if (value === undefined || value === null || value === "") {
        if (field.required) {
            throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' is required.`);
        }
        return;
    }

    switch (field.type) {
        case "string":
            if (typeof value !== "string") {
                throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' must be a string.`);
            }
            break;
        case "number":
            if (typeof value !== "number" || Number.isNaN(value)) {
                throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' must be a number.`);
            }
            break;
        case "boolean":
            if (typeof value !== "boolean") {
                throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' must be a boolean.`);
            }
            break;
        case "string[]":
            if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
                throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' must be an array of strings.`);
            }
            break;
        case "enum":
            if (typeof value !== "string" || !field.options?.includes(value)) {
                throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${field.name}' must be one of ${field.options?.join(", ")}.`);
            }
            break;
        default:
            throw new ServiceError(500, "INVALID_DATASET_SCHEMA", `Unsupported field type '${field.type}'.`);
    }
}

export function validateDatasetEntry(datasetId: string, entry: unknown, index?: number): DatasetEntry {
    const definition = getDatasetDefinition(datasetId);
    const position = index !== undefined ? ` at index ${index}` : "";

    if (definition.entryType === "string") {
        if (typeof entry !== "string") {
            throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Dataset '${datasetId}' expects string entries${position}.`);
        }
        return entry;
    }

    if (!isObject(entry)) {
        throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Dataset '${datasetId}' expects object entries${position}.`);
    }

    const allowedFields = new Set(definition.fields.map((field) => field.name));
    for (const key of Object.keys(entry)) {
        if (!allowedFields.has(key)) {
            throw new ServiceError(422, "INVALID_DATASET_ENTRY", `Field '${key}' is not valid for dataset '${datasetId}'.`);
        }
    }

    for (const field of definition.fields) {
        validateFieldValue(field, entry[field.name]);
    }

    return entry;
}

export async function listDatasets(): Promise<Array<{ id: string; label: string; entryType: string; count: number }>> {
    return await Promise.all(datasetDefinitions.map(async (definition) => {
        const entries = await loadDataset<unknown[]>(definition.path);
        return {
            id: definition.id,
            label: definition.label,
            entryType: definition.entryType,
            count: entries.length,
        };
    }));
}

export async function readDataset(datasetId: string): Promise<{ dataset: { id: string; label: string; path: string; entryType: string }; entries: unknown[] }> {
    const definition = getDatasetDefinition(datasetId);
    const entries = await loadDataset<unknown[]>(definition.path);
    return {
        dataset: {
            id: definition.id,
            label: definition.label,
            path: definition.path,
            entryType: definition.entryType,
        },
        entries,
    };
}

export async function replaceDataset(datasetId: string, entries: unknown[]): Promise<{ datasetId: string; count: number }> {
    const definition = getDatasetDefinition(datasetId);
    const validated = entries.map((entry, index) => validateDatasetEntry(datasetId, entry, index));
    await saveDataset(definition.path, validated);
    return { datasetId, count: validated.length };
}

export async function writeDatasetEntry(
    datasetId: string,
    index: number | null,
    entry?: unknown,
    remove = false,
): Promise<{ datasetId: string; index: number; entry?: DatasetEntry; count: number }> {
    const definition = getDatasetDefinition(datasetId);
    const entries = [...await loadDataset<unknown[]>(definition.path)];

    if (remove) {
        if (index === null || index >= entries.length) {
            throw new ServiceError(404, "DATASET_ENTRY_NOT_FOUND", `Dataset entry '${datasetId}/${index}' does not exist.`);
        }
        entries.splice(index, 1);
        await saveDataset(definition.path, entries);
        return { datasetId, index, count: entries.length };
    }

    const validated = validateDatasetEntry(datasetId, entry, index ?? entries.length);
    if (index === null) {
        entries.push(validated);
        await saveDataset(definition.path, entries);
        return { datasetId, index: entries.length - 1, entry: validated, count: entries.length };
    }
    if (index >= entries.length) {
        throw new ServiceError(404, "DATASET_ENTRY_NOT_FOUND", `Dataset entry '${datasetId}/${index}' does not exist.`);
    }
    entries[index] = validated;
    await saveDataset(definition.path, entries);
    return { datasetId, index, entry: validated, count: entries.length };
}

export async function exportDatasetFile(datasetId: string): Promise<URL> {
    const definition = getDatasetDefinition(datasetId);
    return datasetUrl(definition.path);
}

function escapeCsvCell(value: unknown): string {
    const normalized = Array.isArray(value)
        ? value.join(" | ")
        : value && typeof value === "object"
            ? JSON.stringify(value)
            : String(value ?? "");
    const escaped = normalized.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function datasetEntriesToCsv(entries: unknown[]): string {
    if (entries.length === 0) {
        return "";
    }

    if (entries.every((entry) => typeof entry === "string")) {
        return ["value", ...entries.map((entry) => escapeCsvCell(entry))].join("\n");
    }

    const headers: string[] = [];
    for (const entry of entries) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            continue;
        }
        for (const key of Object.keys(entry)) {
            if (!headers.includes(key)) {
                headers.push(key);
            }
        }
    }

    const rows = entries.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return headers.map(() => "").join(",");
        }
        const record = entry as Record<string, unknown>;
        return headers.map((header) => escapeCsvCell(record[header])).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
}