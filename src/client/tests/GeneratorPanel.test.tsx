import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GeneratorPanel } from "../src/components/GeneratorPanel";
import type { GeneratorDefinition } from "../src/types";

const generate = vi.fn();

vi.mock("../src/api", () => ({
    generate: (...args: unknown[]) => generate(...args),
}));

const definition: GeneratorDefinition = {
    id: "firstname",
    label: "First Name",
    path: "/api/v1/firstname",
    description: "Generate a first name.",
    fields: [
        { name: "startsWith", label: "Starts With", type: "string" },
        { name: "seed", label: "Seed", type: "number" },
    ],
    exampleRequest: { startsWith: "ann", seed: 1 },
};

afterEach(() => {
    cleanup();
    generate.mockReset();
});

describe("GeneratorPanel", () => {
    it("submits dynamic form values and renders formatted responses", async () => {
        generate.mockResolvedValue({ value: "Anna" });

        render(<GeneratorPanel definition={definition} />);

        fireEvent.change(screen.getByLabelText("Starts With"), { target: { value: "stu*" } });
        fireEvent.change(screen.getByLabelText("Seed"), { target: { value: "42" } });
        fireEvent.click(screen.getByRole("button", { name: "Generate" }));

        await waitFor(() => {
            expect(generate).toHaveBeenCalledWith("/api/v1/firstname", { startsWith: "stu*", seed: 42 });
        });
        expect(screen.getByText(/"value": "Anna"/)).toBeTruthy();
    });

    it("resets edited form values back to the example request", () => {
        render(<GeneratorPanel definition={definition} />);

        const startsWithInput = screen.getByLabelText("Starts With") as HTMLInputElement;
        fireEvent.change(startsWithInput, { target: { value: "zed" } });
        expect(startsWithInput.value).toBe("zed");

        fireEvent.click(screen.getByRole("button", { name: "Reset" }));
        expect((screen.getByLabelText("Starts With") as HTMLInputElement).value).toBe("ann");
        expect((screen.getByLabelText("Seed") as HTMLInputElement).value).toBe("1");
    });

    it("shows request errors returned by the client api layer", async () => {
        generate.mockRejectedValue(new Error("NO_MATCH: No value found."));

        render(<GeneratorPanel definition={definition} />);
        fireEvent.click(screen.getByRole("button", { name: "Generate" }));

        expect(await screen.findByText("NO_MATCH: No value found.")).toBeTruthy();
    });
});