export type FieldType = "string" | "number" | "boolean" | "string[]" | "enum";

export interface FieldDefinition {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: readonly string[];
    description?: string;
    placeholder?: string;
}

export interface GeneratorDefinition {
    id: string;
    label: string;
    path: string;
    description: string;
    fields: FieldDefinition[];
    exampleRequest: Record<string, unknown>;
}

export interface BatchDatasetResponse {
    count: number;
    selected: string[];
    records: Array<Record<string, unknown>>;
}

export interface DatasetDefinition {
    id: string;
    label: string;
    path: string;
    entryType: "object" | "string";
    fields: FieldDefinition[];
    description: string;
}

export interface MetaResponse {
    generators: GeneratorDefinition[];
    datasets: DatasetDefinition[];
}

export interface DatasetListItem {
    id: string;
    label: string;
    entryType: string;
    count: number;
}

export interface DatasetListResponse {
    datasets: DatasetListItem[];
}

export interface DatasetDetailResponse {
    dataset: {
        id: string;
        label: string;
        path: string;
        entryType: string;
    };
    entries: unknown[];
}

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
    };
}