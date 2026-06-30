import { describe, expect, it } from "vitest";

import { recordsToCsv } from "../src/export";

describe("export helpers", () => {
    it("serializes record arrays to csv", () => {
        expect(recordsToCsv([
            { firstName: "Anna", lastName: "McKenzie" },
            { firstName: "Ben", lastName: "Carter" },
        ])).toBe("firstName,lastName\nAnna,McKenzie\nBen,Carter");
    });

    it("escapes quotes and joins arrays", () => {
        expect(recordsToCsv([
            { city: "New \"Quoted\" York", tags: ["north", "east"] },
        ])).toBe('city,tags\n"New ""Quoted"" York",north | east');
    });
});