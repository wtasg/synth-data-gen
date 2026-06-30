import { afterEach, describe, expect, it, vi } from "vitest";

import { createDatasetEntry, deleteDatasetEntry, exportDataset, fetchDataset, fetchDatasetList, fetchMeta, generate, generateBatch, importDataset, updateDatasetEntry } from "../src/api";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
});

describe("api client", () => {
    it("fetches metadata from the expected path", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ generators: [], datasets: [] }), { status: 200 })) as typeof fetch;

        await expect(fetchMeta()).resolves.toEqual({ generators: [], datasets: [] });
        expect(globalThis.fetch).toHaveBeenCalledWith("/api/v1/meta", undefined);
    });

    it("builds dataset and generator request URLs and JSON bodies", async () => {
        globalThis.fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;

        await fetchDatasetList();
        await fetchDataset("firstname/en");
        await generate("/api/v1/firstname", { seed: 1 });
        await generateBatch({ count: 3, selected: ["firstname"] });
        await createDatasetEntry("streets/us", "Aurora Way");
        await updateDatasetEntry("streets/us", 4, "Aurora Blvd");
        await deleteDatasetEntry("streets/us", 4);
        await importDataset("streets/us", ["Oak Street"]);

        expect(globalThis.fetch).toHaveBeenNthCalledWith(1, "/api/v1/admin/datasets", undefined);
        expect(globalThis.fetch).toHaveBeenNthCalledWith(2, "/api/v1/admin/datasets/firstname%2Fen", undefined);
        expect(globalThis.fetch).toHaveBeenNthCalledWith(3, "/api/v1/firstname", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ seed: 1 }),
        });
        expect(globalThis.fetch).toHaveBeenNthCalledWith(4, "/api/v1/batch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ count: 3, selected: ["firstname"] }),
        });
        expect(globalThis.fetch).toHaveBeenNthCalledWith(5, "/api/v1/admin/datasets/streets%2Fus", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify("Aurora Way"),
        });
        expect(globalThis.fetch).toHaveBeenNthCalledWith(6, "/api/v1/admin/datasets/streets%2Fus/4", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify("Aurora Blvd"),
        });
        expect(globalThis.fetch).toHaveBeenNthCalledWith(7, "/api/v1/admin/datasets/streets%2Fus/4", {
            method: "DELETE",
        });
        expect(globalThis.fetch).toHaveBeenNthCalledWith(8, "/api/v1/admin/datasets/streets%2Fus/import", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(["Oak Street"]),
        });
    });

    it("formats backend errors from json responses", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "NO_MATCH", message: "No value found." } }), { status: 400 })) as typeof fetch;

        await expect(fetchDataset("missing"))
            .rejects.toThrow("NO_MATCH: No value found.");
    });

    it("returns exported dataset blobs", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(new Response("[\"Maple Avenue\"]", { status: 200 })) as typeof fetch;

        const blob = await exportDataset("streets/us", "csv");
        expect(blob).toBeTruthy();
        expect(blob.size).toBeGreaterThan(0);
        expect(globalThis.fetch).toHaveBeenCalledWith("/api/v1/admin/datasets/streets%2Fus/export?format=csv");
    });
});