import { clearDatasetCache, loadDataset, saveDataset } from "../src/server/datasets/loader.ts";
import { replaceDataset, writeDatasetEntry } from "../src/server/admin/datasets.ts";
import { ServiceError } from "../src/server/validation/errors.ts";
import { assert, assertEquals } from "./helpers.ts";

async function withDatasetRestore<T>(
    path: string,
    run: () => Promise<T>,
): Promise<T> {
    const original = await loadDataset<unknown[]>(path);
    try {
        return await run();
    } finally {
        await saveDataset(path, original);
        clearDatasetCache(path);
    }
}

Deno.test("replaceDataset rewrites dataset contents and reports the new count", async () => {
    await withDatasetRestore("streets/fr.json", async () => {
        const result = await replaceDataset("streets/fr", ["Rue Example", "Avenue Test"]);
        const updated = await loadDataset<string[]>("streets/fr.json");

        assertEquals(result, { datasetId: "streets/fr", count: 2 });
        assertEquals(updated, ["Rue Example", "Avenue Test"]);
    });
});

Deno.test("writeDatasetEntry supports create and update for object datasets", async () => {
    await withDatasetRestore("postal/fr.json", async () => {
        const created = await writeDatasetEntry("postal/fr", null, {
            postalCode: "75999",
            city: "Test City",
            district: "Test District",
            state: "Ile-de-France",
            country: "FR",
            areas: ["Central"],
            weight: 1,
        });

        assertEquals(created.datasetId, "postal/fr");
        const updated = await writeDatasetEntry("postal/fr", created.index, {
            postalCode: "75998",
            city: "Updated City",
            district: "Updated District",
            state: "Ile-de-France",
            country: "FR",
            areas: ["North", "South"],
            weight: 2,
        });

        assertEquals(updated.entry, {
            postalCode: "75998",
            city: "Updated City",
            district: "Updated District",
            state: "Ile-de-France",
            country: "FR",
            areas: ["North", "South"],
            weight: 2,
        });
    });
});

Deno.test("writeDatasetEntry rejects missing indexes for update and delete", async () => {
    try {
        await writeDatasetEntry("streets/fr", 999999, "Missing Street");
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        assertEquals((error as ServiceError).code, "DATASET_ENTRY_NOT_FOUND");
    }

    try {
        await writeDatasetEntry("streets/fr", 999999, undefined, true);
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        assertEquals((error as ServiceError).code, "DATASET_ENTRY_NOT_FOUND");
    }
});

Deno.test("replaceDataset rejects invalid replacement payloads", async () => {
    try {
        await replaceDataset("phone/plans", [{ country: "FR" }]);
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        assertEquals((error as ServiceError).code, "INVALID_DATASET_ENTRY");
    }
});