import type { FieldDefinition } from "./types";

export type FormValues = Record<string, string | boolean>;

export function flattenObject(value: unknown, prefix = "", target: FormValues = {}): FormValues {
    if (value === null || value === undefined) {
        return target;
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        if (prefix) {
            target[prefix] = Array.isArray(value) ? JSON.stringify(value) : String(value);
        }
        return target;
    }

    for (const [key, nested] of Object.entries(value)) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(nested)) {
            target[nextPrefix] = nested.join(", ");
            continue;
        }
        if (typeof nested === "boolean") {
            target[nextPrefix] = nested;
            continue;
        }
        if (nested !== null && typeof nested === "object") {
            flattenObject(nested, nextPrefix, target);
            continue;
        }
        target[nextPrefix] = String(nested);
    }
    return target;
}

function assignPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split(".");
    let cursor: Record<string, unknown> = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
        const part = parts[index];
        const next = cursor[part];
        if (!next || typeof next !== "object" || Array.isArray(next)) {
            cursor[part] = {};
        }
        cursor = cursor[part] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
}

export function parseFieldValue(field: FieldDefinition, rawValue: string | boolean | undefined): unknown {
    if (field.type === "boolean") {
        return Boolean(rawValue);
    }
    if (rawValue === undefined || rawValue === "") {
        return undefined;
    }
    if (field.type === "number") {
        const parsed = Number(rawValue);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (field.type === "string[]") {
        return String(rawValue)
            .split(/\n|,/)
            .map((value) => value.trim())
            .filter(Boolean);
    }
    return String(rawValue);
}

export function buildPayload(fields: FieldDefinition[], values: FormValues): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
        const parsed = parseFieldValue(field, values[field.name]);
        if (parsed === undefined) {
            continue;
        }
        assignPath(payload, field.name, parsed);
    }
    return payload;
}

export function entryToFormValues(entryType: "object" | "string", entry: unknown): FormValues {
    if (entryType === "string") {
        return { value: typeof entry === "string" ? entry : "" };
    }
    return flattenObject(entry);
}

export function validateForm(fields: FieldDefinition[], values: FormValues): string[] {
    const errors: string[] = [];
    for (const field of fields) {
        const value = values[field.name];
        if (field.required && (value === undefined || value === "" || value === false)) {
            errors.push(`${field.label} is required.`);
            continue;
        }
        if (field.type === "number" && typeof value === "string" && value !== "" && Number.isNaN(Number(value))) {
            errors.push(`${field.label} must be a number.`);
        }
    }
    return errors;
}

export function blankValues(fields: FieldDefinition[]): FormValues {
    const values: FormValues = {};
    for (const field of fields) {
        values[field.name] = field.type === "boolean" ? false : "";
    }
    return values;
}