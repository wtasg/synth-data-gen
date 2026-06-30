import { createContainsMatcher } from "../src/server/filters/contains.ts";
import { createEndsWithMatcher } from "../src/server/filters/endsWith.ts";
import { createStartsWithMatcher } from "../src/server/filters/startsWith.ts";
import { datasetEntriesToCsv, exportDatasetFile, validateDatasetEntry } from "../src/server/admin/datasets.ts";
import { BatchDatasetGenerator } from "../src/server/generators/batch_dataset.ts";
import type { BatchDatasetRequest } from "../src/server/models/types.ts";
import { datasetDefinitions, generatorDefinitions, getDatasetDefinition, getMeta } from "../src/server/meta/catalog.ts";
import { createContext } from "../src/server/random/prng.ts";
import { UniformSelectionStrategy, WeightedSelectionStrategy } from "../src/server/random/selection.ts";
import { localeForCountry, normalizeCountry } from "../src/server/utils/country.ts";
import { parseEnvText } from "../src/server/utils/env.ts";
import { normalizePathname } from "../src/server/utils/path.ts";
import { createTextPredicate, matchesLength } from "../src/server/utils/text_filters.ts";
import { ServiceError } from "../src/server/validation/errors.ts";
import {
    parseAddressRequest,
    parseBatchDatasetRequest,
    parseFirstNameRequest,
    parseFullNameRequest,
    parsePersonRequest,
} from "../src/server/validation/request.ts";
import { assert, assertEquals } from "./helpers.ts";

function assertThrowsServiceError(
    run: () => unknown,
    expected: { status: number; code: string; message?: string },
): void {
    try {
        run();
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        const serviceError = error as ServiceError;
        assertEquals(serviceError.status, expected.status);
        assertEquals(serviceError.code, expected.code);
        if (expected.message !== undefined) {
            assertEquals(serviceError.message, expected.message);
        }
    }
}

function maxOccurrence(values: string[]): number {
    const counts = new Map<string, number>();
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Math.max(...counts.values(), 0);
}

Deno.test("normalizePathname collapses repeated slashes and trims trailing slash", () => {
    assertEquals(normalizePathname("/api//v1///firstname/"), "/api/v1/firstname");
    assertEquals(normalizePathname("/"), "/");
});

Deno.test("country helpers normalize input and choose locale", () => {
    assertEquals(normalizeCountry(" in "), "IN");
    assertEquals(localeForCountry("in"), "hi");
    assertEquals(localeForCountry("fr"), "fr");
    assertEquals(localeForCountry("us"), "en");
});

Deno.test("basic string matchers honor case sensitivity", () => {
    assert(createStartsWithMatcher("ann")("Annette"));
    assert(!createStartsWithMatcher("ann", true)("Annette"));
    assert(createEndsWithMatcher("son")("Studentson"));
    assert(createContainsMatcher("ken")("McKenzie"));
});

Deno.test("matchesLength enforces inclusive minimum and maximum lengths", () => {
    assert(matchesLength("Stuart", { min: 6, max: 6 }));
    assert(!matchesLength("Stu", { min: 4 }));
    assert(!matchesLength("Studentson", { max: 5 }));
});

Deno.test("createTextPredicate combines wildcard, contains, suffix, and length filters", () => {
    const predicate = createTextPredicate({
        startsWith: "stu*",
        contains: "den",
        endsWith: "on",
        length: { min: 8, max: 12 },
    });

    assert(predicate("Studentson"));
    assert(!predicate("Stuart"));
    assert(!predicate("student"));
});

Deno.test("createTextPredicate exact matching is case-insensitive by default", () => {
    const insensitive = createTextPredicate({ exact: "mckenzie" });
    const sensitive = createTextPredicate({ exact: "mckenzie", caseSensitive: true });

    assert(insensitive("McKenzie"));
    assert(!sensitive("McKenzie"));
});

Deno.test("parseFirstNameRequest rejects unsupported fields", () => {
    assertThrowsServiceError(
        () => parseFirstNameRequest({ nickname: "Stu" }),
        {
            status: 400,
            code: "UNSUPPORTED_FIELD",
            message: "Unsupported field 'nickname'.",
        },
    );
});

Deno.test("parseFirstNameRequest accepts valid typed fields", () => {
    const request = parseFirstNameRequest({
        gender: "male",
        startsWith: "stu",
        seed: 123,
        length: { min: 5, max: 10 },
        caseSensitive: false,
    });

    assertEquals(request.gender, "male");
    assertEquals(request.startsWith, "stu");
    assertEquals(request.seed, 123);
    assertEquals(request.length, { min: 5, max: 10 });
});

Deno.test("parseFullNameRequest rejects invalid surnameCount", () => {
    assertThrowsServiceError(
        () => parseFullNameRequest({ surnameCount: 0 }),
        {
            status: 422,
            code: "IMPOSSIBLE_CONSTRAINT",
            message: "Field 'surnameCount' must be at least 1.",
        },
    );
});

Deno.test("parsePersonRequest rejects age combined with minAge or maxAge", () => {
    assertThrowsServiceError(
        () => parsePersonRequest({ age: 30, minAge: 20 }),
        {
            status: 422,
            code: "IMPOSSIBLE_CONSTRAINT",
            message: "Field 'age' cannot be combined with 'minAge' or 'maxAge'.",
        },
    );
});

Deno.test("parseAddressRequest rejects invalid length ranges", () => {
    assertThrowsServiceError(
        () => parseAddressRequest({ length: { min: 10, max: 5 } }),
        {
            status: 422,
            code: "IMPOSSIBLE_CONSTRAINT",
            message: "Field 'length.min' cannot exceed 'length.max'.",
        },
    );
});

Deno.test("createContext with the same seed produces the same random sequence", () => {
    const left = createContext(12345);
    const right = createContext(12345);

    assertEquals(left.seed, 12345);
    assertEquals(right.seed, 12345);
    assertEquals(left.rng.next(), right.rng.next());
    assertEquals(left.rng.int(1000), right.rng.int(1000));
    assertEquals(left.rng.int(1000), right.rng.int(1000));
});

Deno.test("rng int rejects non-positive maximums", () => {
    const context = createContext(1);

    try {
        context.rng.int(0);
        throw new Error("Expected RangeError");
    } catch (error) {
        assert(error instanceof RangeError);
        assertEquals(error.message, "maxExclusive must be a positive integer");
    }
});

Deno.test("uniform selection chooses the indexed item from the rng", () => {
    const strategy = new UniformSelectionStrategy<string>();
    const rng = {
        next(): number {
            return 0.9;
        },
        int(maxExclusive: number): number {
            return maxExclusive - 1;
        },
    };

    assertEquals(strategy.select(["a", "b", "c"], rng), "c");
});

Deno.test("weighted selection prefers the bucket reached by the random cursor", () => {
    const strategy = new WeightedSelectionStrategy<{ label: string; weight: number }>((item: { label: string; weight: number }) => item.weight);
    const rng = {
        next(): number {
            return 0.65;
        },
        int(): number {
            return 0;
        },
    };

    const choice = strategy.select([
        { label: "light", weight: 1 },
        { label: "medium", weight: 3 },
        { label: "heavy", weight: 6 },
    ], rng);

    assertEquals(choice.label, "heavy");
});

Deno.test("weighted selection falls back to uniform selection when all weights are zero", () => {
    const strategy = new WeightedSelectionStrategy<{ label: string; weight: number }>((item: { label: string; weight: number }) => item.weight);
    const rng = {
        next(): number {
            return 0;
        },
        int(maxExclusive: number): number {
            return Math.min(1, maxExclusive - 1);
        },
    };

    const choice = strategy.select([
        { label: "first", weight: 0 },
        { label: "second", weight: 0 },
    ], rng);

    assertEquals(choice.label, "second");
});

Deno.test("getMeta exposes the configured generators and datasets", () => {
    const meta = getMeta();

    assertEquals(meta.generators.length, generatorDefinitions.length);
    assertEquals(meta.datasets.length, datasetDefinitions.length);
    assertEquals(meta.generators[0].id, "firstname");
});

Deno.test("getDatasetDefinition returns known datasets and rejects unknown ones", () => {
    assertEquals(getDatasetDefinition("streets/us").path, "streets/us.json");

    try {
        getDatasetDefinition("unknown/dataset");
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        const serviceError = error as ServiceError;
        assertEquals(serviceError.status, 404);
        assertEquals(serviceError.code, "DATASET_NOT_FOUND");
    }
});

Deno.test("validateDatasetEntry accepts object and string dataset shapes", () => {
    assertEquals(
        validateDatasetEntry("firstname/en", { value: "Anna", gender: "female", country: ["US"], weight: 3 }),
        { value: "Anna", gender: "female", country: ["US"], weight: 3 },
    );
    assertEquals(validateDatasetEntry("streets/us", "Maple Avenue"), "Maple Avenue");
});

Deno.test("validateDatasetEntry rejects wrong field types and unknown fields", () => {
    try {
        validateDatasetEntry("firstname/en", { value: "Anna", gender: "robot" });
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        const serviceError = error as ServiceError;
        assertEquals(serviceError.code, "INVALID_DATASET_ENTRY");
    }

    try {
        validateDatasetEntry("postal/us", { postalCode: "10001", city: "New York", district: "New York County", state: "New York", country: "US", areas: ["Chelsea"], extra: true });
        throw new Error("Expected ServiceError");
    } catch (error) {
        assert(error instanceof ServiceError);
        const serviceError = error as ServiceError;
        assertEquals(serviceError.code, "INVALID_DATASET_ENTRY");
    }
});

Deno.test("exportDatasetFile resolves dataset file urls", async () => {
    const url = await exportDatasetFile("streets/us");

    assert(url.pathname.endsWith("/data/streets/us.json"));
});

Deno.test("parseBatchDatasetRequest validates selected generators and count", () => {
    const request = parseBatchDatasetRequest({
        count: 10,
        selected: ["firstname", "lastname"],
        requests: {
            firstname: { startsWith: "ann" },
            lastname: { startsWith: "mc" },
        },
    });

    assertEquals(request.count, 10);
    assertEquals(request.selected, ["firstname", "lastname"]);
});

Deno.test("BatchDatasetGenerator composes multiple generator outputs into records", async () => {
    const generator = new BatchDatasetGenerator();
    const response = await generator.generate({
        count: 2,
        selected: ["firstname", "lastname"],
        seed: 55,
        requests: {
            firstname: { startsWith: "ann" },
            lastname: { startsWith: "mc" },
        },
    }, createContext(55));

    assertEquals(response.count, 2);
    assertEquals(response.records.length, 2);
    assert(typeof response.records[0].firstName === "string");
    assertEquals(response.records[0].lastName, "McKenzie");
});

Deno.test("BatchDatasetGenerator advances randomness across records when requests are empty", async () => {
    const generator = new BatchDatasetGenerator();
    const response = await generator.generate({
        count: 12,
        selected: ["firstname", "lastname"],
        seed: 123,
    }, createContext(123));

    const firstNames = new Set(response.records.map((record) => String(record.firstName)));
    const lastNames = new Set(response.records.map((record) => String(record.lastName)));
    const rows = response.records.map((record) => `${String(record.firstName)}|${String(record.lastName)}`);

    assert(firstNames.size >= 6);
    assert(lastNames.size >= 6);
    assert(maxOccurrence(rows) <= 2);
});

Deno.test("BatchDatasetGenerator is seed-stable without degenerating to a single repeated record", async () => {
    const generator = new BatchDatasetGenerator();
    const payload: BatchDatasetRequest = {
        count: 12,
        selected: ["firstname", "lastname"],
        seed: 123,
    };

    const left = await generator.generate(payload, createContext(123));
    const right = await generator.generate(payload, createContext(123));

    assertEquals(left, right);
    assert(new Set(left.records.map((record) => `${String(record.firstName)}|${String(record.lastName)}`)).size >= 6);
});

Deno.test("datasetEntriesToCsv serializes string and object entries", () => {
    assertEquals(datasetEntriesToCsv(["Maple Avenue", "Oak Road"]), "value\nMaple Avenue\nOak Road");
    assert(datasetEntriesToCsv([{ city: "Paris", postalCode: "75001" }]).includes("city,postalCode"));
});

Deno.test("parseEnvText reads env assignments and strips quotes", () => {
    assertEquals(parseEnvText("SERVER_PORT=16010\nCLIENT_HOST=\"0.0.0.0\"\n# comment\n"), {
        SERVER_PORT: "16010",
        CLIENT_HOST: "0.0.0.0",
    });
});