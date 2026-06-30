import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BatchBuilderPanel } from "../src/components/BatchBuilderPanel";
import type { GeneratorDefinition } from "../src/types";

const generateBatch = vi.fn();
const downloadText = vi.fn();

vi.mock("../src/api", () => ({
    generateBatch: (...args: unknown[]) => generateBatch(...args),
}));

vi.mock("../src/export", async () => {
    const actual = await vi.importActual<typeof import("../src/export")>("../src/export");
    return {
        ...actual,
        downloadText: (...args: unknown[]) => downloadText(...args),
    };
});

const generators: GeneratorDefinition[] = [
    {
        id: "firstname",
        label: "First Name",
        path: "/api/v1/firstname",
        description: "Generate first names.",
        fields: [],
        exampleRequest: { startsWith: "ann" },
    },
    {
        id: "lastname",
        label: "Last Name",
        path: "/api/v1/lastname",
        description: "Generate last names.",
        fields: [],
        exampleRequest: { startsWith: "mc" },
    },
    {
        id: "phone",
        label: "Phone",
        path: "/api/v1/phone",
        description: "Generate phone numbers.",
        fields: [],
        exampleRequest: { country: "IN" },
    },
];

afterEach(() => {
    cleanup();
    generateBatch.mockReset();
    downloadText.mockReset();
});

describe("BatchBuilderPanel", () => {
    it("submits count and selected generators to the batch endpoint", async () => {
        generateBatch.mockResolvedValue({
            count: 10,
            selected: ["firstname", "lastname", "phone"],
            records: [{ firstName: "Anna", lastName: "McKenzie", phone: { countryCode: "+91" } }],
        });

        render(<BatchBuilderPanel generators={generators} />);

        fireEvent.click(screen.getByLabelText("Phone"));
        fireEvent.change(screen.getByLabelText("Record Count"), { target: { value: "10" } });
        fireEvent.click(screen.getByRole("button", { name: "Generate Dataset" }));

        await waitFor(() => {
            expect(generateBatch).toHaveBeenCalledWith({
                count: 10,
                selected: ["firstname", "lastname", "phone"],
            });
        });
        expect(screen.getByText(/"count": 10/)).toBeTruthy();
    });

    it("shows batch request errors", async () => {
        generateBatch.mockRejectedValue(new Error("IMPOSSIBLE_CONSTRAINT: Select at least one generator."));

        render(<BatchBuilderPanel generators={generators} />);
        fireEvent.click(screen.getByLabelText("First Name"));
        fireEvent.click(screen.getByLabelText("Last Name"));
        fireEvent.click(screen.getByRole("button", { name: "Generate Dataset" }));

        expect(await screen.findByText("IMPOSSIBLE_CONSTRAINT: Select at least one generator.")).toBeTruthy();
    });

    it("exports generated records as csv and json", async () => {
        generateBatch.mockResolvedValue({
            count: 2,
            selected: ["firstname", "lastname"],
            records: [{ firstName: "Anna", lastName: "McKenzie" }],
        });

        render(<BatchBuilderPanel generators={generators} />);
        fireEvent.click(screen.getByRole("button", { name: "Generate Dataset" }));
        await screen.findByText(/"lastName": "McKenzie"/);

        fireEvent.click(screen.getByRole("button", { name: "Export JSON" }));
        fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

        expect(downloadText).toHaveBeenCalledTimes(2);
        expect(downloadText).toHaveBeenNthCalledWith(1, "generated-records.json", expect.stringContaining('"count": 2'), "application/json");
        expect(downloadText).toHaveBeenNthCalledWith(2, "generated-records.csv", expect.stringContaining("firstName,lastName"), "text/csv;charset=utf-8");
    });
});