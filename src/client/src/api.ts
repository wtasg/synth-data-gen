import type { BatchDatasetResponse, DatasetDetailResponse, DatasetListResponse, ErrorResponse, MetaResponse } from "./types";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: { code: "HTTP_ERROR", message: response.statusText } })) as ErrorResponse;
        throw new Error(`${payload.error.code}: ${payload.error.message}`);
    }
    return await response.json() as T;
}

export function fetchMeta(): Promise<MetaResponse> {
    return request<MetaResponse>("/api/v1/meta");
}

export function fetchDatasetList(): Promise<DatasetListResponse> {
    return request<DatasetListResponse>("/api/v1/admin/datasets");
}

export function fetchDataset(id: string): Promise<DatasetDetailResponse> {
    return request<DatasetDetailResponse>(`/api/v1/admin/datasets/${encodeURIComponent(id)}`);
}

export function generate(path: string, payload: unknown): Promise<unknown> {
    return request(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function generateBatch(payload: unknown): Promise<BatchDatasetResponse> {
    return request<BatchDatasetResponse>("/api/v1/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function createDatasetEntry(id: string, payload: unknown): Promise<unknown> {
    return request(`/api/v1/admin/datasets/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function updateDatasetEntry(id: string, index: number, payload: unknown): Promise<unknown> {
    return request(`/api/v1/admin/datasets/${encodeURIComponent(id)}/${index}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export function deleteDatasetEntry(id: string, index: number): Promise<unknown> {
    return request(`/api/v1/admin/datasets/${encodeURIComponent(id)}/${index}`, {
        method: "DELETE",
    });
}

export function importDataset(id: string, payload: unknown[]): Promise<unknown> {
    return request(`/api/v1/admin/datasets/${encodeURIComponent(id)}/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function exportDataset(id: string, format: "json" | "csv" = "json"): Promise<Blob> {
    const response = await fetch(`/api/v1/admin/datasets/${encodeURIComponent(id)}/export?format=${format}`);
    if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: { code: "HTTP_ERROR", message: response.statusText } })) as ErrorResponse;
        throw new Error(`${payload.error.code}: ${payload.error.message}`);
    }
    return await response.blob();
}