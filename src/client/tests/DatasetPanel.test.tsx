import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatasetPanel } from "../src/components/DatasetPanel";
import type { DatasetDefinition } from "../src/types";

const fetchDataset = vi.fn();
const createDatasetEntry = vi.fn();
const updateDatasetEntry = vi.fn();
const deleteDatasetEntry = vi.fn();
const importDataset = vi.fn();
const exportDataset = vi.fn();
const downloadBlob = vi.fn();

vi.mock("../src/api", () => ({
    fetchDataset: (...args: unknown[]) => fetchDataset(...args),
    createDatasetEntry: (...args: unknown[]) => createDatasetEntry(...args),
    updateDatasetEntry: (...args: unknown[]) => updateDatasetEntry(...args),
    deleteDatasetEntry: (...args: unknown[]) => deleteDatasetEntry(...args),
    importDataset: (...args: unknown[]) => importDataset(...args),
    exportDataset: (...args: unknown[]) => exportDataset(...args),
}));

vi.mock("../src/export", async () => {
    const actual = await vi.importActual<typeof import("../src/export")>("../src/export");
    return {
        ...actual,
        downloadBlob: (...args: unknown[]) => downloadBlob(...args),
    };
});

const definition: DatasetDefinition = {
    id: "streets/us",
    label: "Street Names (US)",
    path: "streets/us.json",
    entryType: "string",
    fields: [{ name: "value", label: "Value", type: "string", required: true }],
    description: "Street name values.",
};

afterEach(() => {
    cleanup();
    fetchDataset.mockReset();
    createDatasetEntry.mockReset();
    updateDatasetEntry.mockReset();
    deleteDatasetEntry.mockReset();
    importDataset.mockReset();
    exportDataset.mockReset();
    downloadBlob.mockReset();
});

describe("DatasetPanel", () => {
    it("loads entries and filters them using the search box", async () => {
        fetchDataset.mockResolvedValue({ dataset: { id: definition.id, label: definition.label, path: definition.path, entryType: definition.entryType }, entries: ["Maple Avenue", "Oak Road"] });

        render(<DatasetPanel definition={definition} refreshToken={0} onMutated={vi.fn()} />);

        await screen.findByText("Maple Avenue");
        fireEvent.change(screen.getByPlaceholderText("Search entries"), { target: { value: "oak" } });

        expect(screen.queryByText("Maple Avenue")).toBeNull();
        expect(screen.getByText("Oak Road")).toBeTruthy();
    });

    it("edits an existing entry and calls the update api", async () => {
        const onMutated = vi.fn();
        fetchDataset.mockResolvedValue({ dataset: { id: definition.id, label: definition.label, path: definition.path, entryType: definition.entryType }, entries: ["Maple Avenue"] });
        updateDatasetEntry.mockResolvedValue({});

        render(<DatasetPanel definition={definition} refreshToken={0} onMutated={onMutated} />);

        await screen.findByText("Maple Avenue");
        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        fireEvent.change(screen.getByLabelText("Value"), { target: { value: "Maple Street" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(updateDatasetEntry).toHaveBeenCalledWith("streets/us", 0, "Maple Street");
        });
        expect(onMutated).toHaveBeenCalled();
    });

    it("shows validation errors instead of creating invalid entries", async () => {
        fetchDataset.mockResolvedValue({ dataset: { id: definition.id, label: definition.label, path: definition.path, entryType: definition.entryType }, entries: [] });

        render(<DatasetPanel definition={definition} refreshToken={0} onMutated={vi.fn()} />);

        await waitFor(() => expect(fetchDataset).toHaveBeenCalled());
        fireEvent.click(screen.getByRole("button", { name: "Create" }));

        expect(await screen.findByText("Value is required.")).toBeTruthy();
        expect(createDatasetEntry).not.toHaveBeenCalled();
    });

    it("deletes entries through the dataset api", async () => {
        const onMutated = vi.fn();
        fetchDataset.mockResolvedValue({ dataset: { id: definition.id, label: definition.label, path: definition.path, entryType: definition.entryType }, entries: ["Maple Avenue"] });
        deleteDatasetEntry.mockResolvedValue({});

        render(<DatasetPanel definition={definition} refreshToken={0} onMutated={onMutated} />);

        await screen.findByText("Maple Avenue");
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => {
            expect(deleteDatasetEntry).toHaveBeenCalledWith("streets/us", 0);
        });
        expect(onMutated).toHaveBeenCalled();
    });

    it("exports datasets as csv", async () => {
        fetchDataset.mockResolvedValue({ dataset: { id: definition.id, label: definition.label, path: definition.path, entryType: definition.entryType }, entries: ["Maple Avenue"] });
        exportDataset.mockResolvedValue(new Blob(["value\nMaple Avenue\n"], { type: "text/csv" }));

        render(<DatasetPanel definition={definition} refreshToken={0} onMutated={vi.fn()} />);

        await screen.findByText("Maple Avenue");
        fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

        await waitFor(() => {
            expect(exportDataset).toHaveBeenCalledWith("streets/us", "csv");
        });
        expect(downloadBlob).toHaveBeenCalledWith("streets-us.csv", expect.any(Blob));
    });
});