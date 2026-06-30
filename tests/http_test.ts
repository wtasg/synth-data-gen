import { createHandler } from "../src/server/app.ts";
import { assert, assertEquals, assertMatch } from "./helpers.ts";

const handler = createHandler();

function countOccurrences(values: string[]): number {
    const counts = new Map<string, number>();
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Math.max(...counts.values(), 0);
}

async function post(path: string, body: unknown): Promise<Response> {
    return await handler(new Request(`http://localhost:8000${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    }));
}

async function put(path: string, body: unknown): Promise<Response> {
    return await handler(new Request(`http://localhost:8000${path}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    }));
}

async function get(path: string): Promise<Response> {
    return await handler(new Request(`http://localhost:8000${path}`, {
        method: "GET",
    }));
}

async function del(path: string): Promise<Response> {
    return await handler(new Request(`http://localhost:8000${path}`, {
        method: "DELETE",
    }));
}

Deno.test("POST /api/v1//firstname returns a seeded first name", async () => {
    const response = await post("/api/v1//firstname", {
        gender: "male",
        startsWith: "stu",
        length: { min: 5, max: 10 },
        seed: 123,
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body, { value: "Stuart" });
});

Deno.test("POST /api/v1/lastname returns a matching last name", async () => {
    const response = await post("/api/v1/lastname", { startsWith: "mc" });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body, { value: "McKenzie" });
});

Deno.test("POST /api/v1/fullname builds a composed full name", async () => {
    const response = await post("/api/v1/fullname", {
        gender: "female",
        middleName: true,
        surnameCount: 2,
        startsWith: "ann*",
        seed: 8,
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertMatch(body.firstName, /^Ann/i);
    assert(body.fullName.includes(body.lastName));
});

Deno.test("POST /api/v1/person returns a structured person", async () => {
    const response = await post("/api/v1/person", { gender: "male", country: "US", seed: 77 });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertMatch(body.dateOfBirth, /^\d{4}-\d{2}-\d{2}$/);
    assert(typeof body.age === "number");
});

Deno.test("POST /api/v1/address returns a filtered address", async () => {
    const response = await post("/api/v1/address", {
        country: "IN",
        state: "Karnataka",
        pin: "560*",
        seed: 10,
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.state, "Karnataka");
    assertMatch(body.postalCode, /^560/);
});

Deno.test("POST /api/v1/phone returns a filtered phone number", async () => {
    const response = await post("/api/v1/phone", { country: "IN", startsWith: "98*", seed: 12 });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.countryCode, "+91");
    assertMatch(body.nationalNumber, /^98/);
});

Deno.test("invalid request bodies return 400", async () => {
    const response = await handler(new Request("http://localhost:8000/api/v1/firstname", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad json",
    }));
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error.code, "INVALID_JSON");
});

Deno.test("impossible constraints return 422", async () => {
    const response = await post("/api/v1/person", { minAge: 50, maxAge: 20 });
    const body = await response.json();

    assertEquals(response.status, 422);
    assertEquals(body.error.code, "IMPOSSIBLE_CONSTRAINT");
});

Deno.test("missing matches return 400", async () => {
    const response = await post("/api/v1/firstname", { wildcard: "stuq*" });
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error.code, "NO_MATCH");
});

Deno.test("unknown endpoints return 404", async () => {
    const response = await post("/api/v1/unknown", {});
    const body = await response.json();

    assertEquals(response.status, 404);
    assertEquals(body.error.code, "NOT_FOUND");
});

Deno.test("concurrent seeded requests are stable", async () => {
    const responses = await Promise.all(Array.from({ length: 8 }, () =>
        post("/api/v1/firstname", { gender: "male", startsWith: "stu", seed: 222 })
            .then((response) => response.json())
    ));

    for (const payload of responses) {
        assertEquals(payload, responses[0]);
    }
});

Deno.test("GET /api/v1/meta exposes generator and dataset definitions", async () => {
    const response = await get("/api/v1/meta");
    const body = await response.json();

    assertEquals(response.status, 200);
    assert(body.generators.length >= 6);
    assert(body.datasets.length >= 10);
});

Deno.test("GET /api/v1/admin/datasets lists dataset counts", async () => {
    const response = await get("/api/v1/admin/datasets");
    const body = await response.json();

    assertEquals(response.status, 200);
    assert(body.datasets.some((dataset: { id: string }) => dataset.id === "firstname/en"));
});

Deno.test("dataset admin endpoints can create, update, and delete string entries", async () => {
    const createResponse = await post("/api/v1/admin/datasets/streets%2Fus", "Aurora Vista Way");
    const created = await createResponse.json();
    assertEquals(createResponse.status, 201);
    assert(typeof created.index === "number");

    const updateResponse = await put(`/api/v1/admin/datasets/streets%2Fus/${created.index}`, "Aurora Vista Boulevard");
    const updated = await updateResponse.json();
    assertEquals(updateResponse.status, 200);
    assertEquals(updated.entry, "Aurora Vista Boulevard");

    const deleteResponse = await del(`/api/v1/admin/datasets/streets%2Fus/${created.index}`);
    const deleted = await deleteResponse.json();
    assertEquals(deleteResponse.status, 200);
    assertEquals(deleted.datasetId, "streets/us");
});

Deno.test("dataset validation rejects malformed object entries", async () => {
    const response = await post("/api/v1/admin/datasets/firstname%2Fen/validate", { value: 123 });
    const body = await response.json();

    assertEquals(response.status, 422);
    assertEquals(body.error.code, "INVALID_DATASET_ENTRY");
});

Deno.test("POST /api/v1/batch generates multiple selected fields with a record count", async () => {
    const response = await post("/api/v1/batch", {
        count: 3,
        selected: ["firstname", "lastname"],
        seed: 123,
        requests: {
            firstname: { gender: "male", startsWith: "stu" },
            lastname: { startsWith: "mc" },
        },
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(body.count, 3);
    assertEquals(body.records.length, 3);
    assertEquals(body.records[0].firstName, "Stuart");
    assertEquals(body.records[0].lastName, "McKenzie");
});

Deno.test("POST /api/v1/batch rejects empty selections", async () => {
    const response = await post("/api/v1/batch", { count: 3, selected: [] });
    const body = await response.json();

    assertEquals(response.status, 422);
    assertEquals(body.error.code, "IMPOSSIBLE_CONSTRAINT");
});

Deno.test("POST /api/v1/batch produces varied records when no restrictive filters are supplied", async () => {
    const response = await post("/api/v1/batch", {
        count: 12,
        selected: ["firstname", "lastname"],
        seed: 123,
    });
    const body = await response.json();

    assertEquals(response.status, 200);
    const firstNames = new Set(body.records.map((record: { firstName: string }) => record.firstName));
    const lastNames = new Set(body.records.map((record: { lastName: string }) => record.lastName));
    const fullRows = body.records.map((record: { firstName: string; lastName: string }) => `${record.firstName}|${record.lastName}`);

    assert(firstNames.size >= 6);
    assert(lastNames.size >= 6);
    assert(countOccurrences(fullRows) <= 2);
});

Deno.test("POST /api/v1/batch is deterministic for the same seed without collapsing to one repeated row", async () => {
    const payload = {
        count: 12,
        selected: ["firstname", "lastname"],
        seed: 123,
    };

    const left = await post("/api/v1/batch", payload).then((response) => response.json());
    const right = await post("/api/v1/batch", payload).then((response) => response.json());

    assertEquals(left, right);
    const rows = left.records.map((record: { firstName: string; lastName: string }) => `${record.firstName}|${record.lastName}`);
    assert(new Set(rows).size >= 6);
});

Deno.test("dataset export supports csv format", async () => {
    const response = await get("/api/v1/admin/datasets/streets%2Fus/export?format=csv");
    const body = await response.text();

    assertEquals(response.status, 200);
    assert(response.headers.get("content-type")?.includes("text/csv"));
    assert(body.includes("value"));
});