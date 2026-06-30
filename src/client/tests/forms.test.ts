import { describe, expect, it } from "vitest";

import { blankValues, buildPayload, entryToFormValues, flattenObject, parseFieldValue, validateForm } from "../src/forms";
import type { FieldDefinition } from "../src/types";

const fields: FieldDefinition[] = [
    { name: "seed", label: "Seed", type: "number" },
    { name: "middleName", label: "Middle Name", type: "boolean" },
    { name: "length.min", label: "Length Min", type: "number" },
    { name: "tags", label: "Tags", type: "string[]" },
    { name: "value", label: "Value", type: "string", required: true },
];

describe("forms", () => {
    it("flattens nested objects and arrays into form values", () => {
        expect(flattenObject({ seed: 123, length: { min: 4 }, tags: ["one", "two"], middleName: true })).toEqual({
            seed: "123",
            "length.min": "4",
            tags: "one, two",
            middleName: true,
        });
    });

    it("parses field values by field type", () => {
        expect(parseFieldValue(fields[0], "12")).toBe(12);
        expect(parseFieldValue(fields[1], true)).toBe(true);
        expect(parseFieldValue(fields[3], "alpha, beta\ngamma")).toEqual(["alpha", "beta", "gamma"]);
        expect(parseFieldValue(fields[0], "not-a-number")).toBeUndefined();
    });

    it("builds nested payloads from flattened field names", () => {
        expect(buildPayload(fields, {
            seed: "321",
            middleName: true,
            "length.min": "5",
            tags: "red, blue",
            value: "Annette",
        })).toEqual({
            seed: 321,
            middleName: true,
            length: { min: 5 },
            tags: ["red", "blue"],
            value: "Annette",
        });
    });

    it("converts string and object dataset entries into form values", () => {
        expect(entryToFormValues("string", "Maple Avenue")).toEqual({ value: "Maple Avenue" });
        expect(entryToFormValues("object", { value: "Anna", country: ["US", "GB"] })).toEqual({
            value: "Anna",
            country: "US, GB",
        });
    });

    it("validates required and numeric fields", () => {
        expect(validateForm(fields, { seed: "oops", middleName: false, "length.min": "", tags: "", value: "" })).toEqual([
            "Seed must be a number.",
            "Value is required.",
        ]);
    });

    it("creates blank values with boolean defaults", () => {
        expect(blankValues(fields)).toEqual({
            seed: "",
            middleName: false,
            "length.min": "",
            tags: "",
            value: "",
        });
    });
});