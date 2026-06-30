import { AddressGenerator } from "../src/server/generators/address.ts";
import { FirstNameGenerator } from "../src/server/generators/firstname.ts";
import { FullNameGenerator } from "../src/server/generators/fullname.ts";
import { LastNameGenerator } from "../src/server/generators/lastname.ts";
import { PersonGenerator } from "../src/server/generators/person.ts";
import { PhoneGenerator } from "../src/server/generators/phone.ts";
import { createWildcardMatcher } from "../src/server/filters/wildcard.ts";
import { ServiceError } from "../src/server/validation/errors.ts";
import { assert, assertEquals, assertMatch } from "./helpers.ts";

Deno.test("wildcard matching is case-insensitive", () => {
    const matcher = createWildcardMatcher("stu*");
    assert(matcher("Stuart"));
    assert(matcher("studentson"));
    assert(!matcher("Andrew"));
});

Deno.test("first name generation is deterministic for the same seed", async () => {
    const generator = new FirstNameGenerator();
    const request = {
        gender: "male" as const,
        startsWith: "stu",
        length: { min: 5, max: 10 },
        seed: 123,
    };

    const left = await generator.generate(request);
    const right = await generator.generate(request);

    assertEquals(left, right);
});

Deno.test("first name generation supports deterministic seed-specific outputs", async () => {
    const generator = new FirstNameGenerator();

    const left = await generator.generate({ gender: "female", startsWith: "ann", seed: 1 });
    const right = await generator.generate({ gender: "female", startsWith: "ann", seed: 4 });

    assertEquals(left, { value: "Anna" });
    assertEquals(right, { value: "Anne" });
});

Deno.test("last name generator supports wildcard prefixes", async () => {
    const generator = new LastNameGenerator();
    const response = await generator.generate({ wildcard: "mc*", seed: 9 });

    assertEquals(response, { value: "McKenzie" });
});

Deno.test("full name generator supports middle names and multiple surnames", async () => {
    const generator = new FullNameGenerator();
    const response = await generator.generate({
        gender: "female",
        middleName: true,
        surnameCount: 2,
        startsWith: "ann*",
        seed: 321,
    });

    assertMatch(response.firstName, /^Ann/i);
    assert(response.middleName !== undefined);
    assertEquals(response.lastName.split(" ").length, 2);
    assert(response.fullName.includes(response.lastName));
});

Deno.test("person generator honors exact age constraints", async () => {
    const generator = new PersonGenerator();
    const response = await generator.generate({ age: 32, gender: "male", seed: 55 });

    assertEquals(response.age, 32);
    assertMatch(response.dateOfBirth, /^\d{4}-\d{2}-\d{2}$/);
});

Deno.test("address generator supports pin wildcard filters", async () => {
    const generator = new AddressGenerator();
    const response = await generator.generate({
        country: "IN",
        state: "Karnataka",
        pin: "560*",
        seed: 99,
    });

    assertMatch(response.postalCode, /^560/);
    assertEquals(response.country, "IN");
});

Deno.test("phone generator supports seeded startsWith filters", async () => {
    const generator = new PhoneGenerator();
    const response = await generator.generate({ country: "IN", startsWith: "98*", seed: 12345 });

    assertMatch(response.nationalNumber, /^98\d{8}$/);
    assertEquals(response.countryCode, "+91");
});

Deno.test("impossible constraints surface as structured errors", async () => {
    const generator = new FirstNameGenerator();

    try {
        await generator.generate({ startsWith: "stu", length: { min: 50 }, seed: 1 });
        throw new Error("Expected generator to throw");
    } catch (error) {
        assert(error instanceof ServiceError);
        const serviceError = error as ServiceError;
        assertEquals(serviceError.code, "NO_MATCH");
    }
});