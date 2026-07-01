import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FieldInput } from "../src/components/FieldInput";
import type { FieldDefinition } from "../src/types";

afterEach(() => {
    cleanup();
});

describe("FieldInput", () => {
    it("renders string fields with accessible labels and emits text changes", () => {
        const onChange = vi.fn();
        const field: FieldDefinition = { name: "startsWith", label: "Starts With", type: "string", placeholder: "ann" };

        render(<FieldInput field={field} value="jo" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Starts With"), { target: { value: "ann" } });

        expect(onChange).toHaveBeenCalledWith("startsWith", "ann");
        expect(screen.getByPlaceholderText("ann")).toBeTruthy();
    });

    it("renders number fields and forwards their raw input value", () => {
        const onChange = vi.fn();
        const field: FieldDefinition = { name: "seed", label: "Seed", type: "number" };

        render(<FieldInput field={field} value="1" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Seed"), { target: { value: "42" } });

        expect(onChange).toHaveBeenCalledWith("seed", "42");
    });

    it("renders enum fields with options", () => {
        const onChange = vi.fn();
        const field: FieldDefinition = { name: "country", label: "Country", type: "enum", options: ["US", "IN"] };

        render(<FieldInput field={field} value="US" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Country"), { target: { value: "IN" } });

        expect(screen.getByRole("option", { name: "Any" })).toBeTruthy();
        expect(screen.getByRole("option", { name: "US" })).toBeTruthy();
        expect(onChange).toHaveBeenCalledWith("country", "IN");
    });

    it("renders string array fields as textareas", () => {
        const onChange = vi.fn();
        const field: FieldDefinition = { name: "values", label: "Values", type: "string[]" };

        render(<FieldInput field={field} value="alpha\nbeta" onChange={onChange} />);
        fireEvent.change(screen.getByLabelText("Values"), { target: { value: "gamma,delta" } });

        expect(screen.getByPlaceholderText("comma or newline separated")).toBeTruthy();
        expect(onChange).toHaveBeenCalledWith("values", "gamma,delta");
    });

    it("renders boolean fields as checkboxes", () => {
        const onChange = vi.fn();
        const field: FieldDefinition = { name: "active", label: "Active", type: "boolean" };

        render(<FieldInput field={field} value={false} onChange={onChange} />);
        fireEvent.click(screen.getByLabelText("Active"));

        expect(onChange).toHaveBeenCalledWith("active", true);
    });
});
