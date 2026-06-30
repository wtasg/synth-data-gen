import type { Generator, PersonRequest, PersonResponse } from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { FullNameGenerator } from "./fullname.ts";
import { resolveContext } from "./shared.ts";

function yearsAgo(date: Date, years: number): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear() - years,
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
}

function calculateAge(dateOfBirth: Date, today: Date): number {
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDelta = today.getUTCDate() - dateOfBirth.getUTCDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }
  return age;
}

function pickAge(request: PersonRequest, context: GenerationContext): number {
  if (request.age !== undefined) {
    return request.age;
  }
  const minAge = request.minAge ?? 18;
  const maxAge = request.maxAge ?? 80;
  return minAge + context.rng.int(maxAge - minAge + 1);
}

function pickBirthDate(age: number, context: GenerationContext): Date {
  const today = new Date();
  const earliest = yearsAgo(today, age + 1).getTime() + 24 * 60 * 60 * 1000;
  const latest = yearsAgo(today, age).getTime();
  const span = latest - earliest + 1;
  const offset = span > 0 ? context.rng.int(span) : 0;
  return new Date(earliest + offset);
}

export class PersonGenerator implements Generator<PersonRequest, PersonResponse> {
  readonly #fullNameGenerator = new FullNameGenerator();

  async generate(
    request: PersonRequest,
    context?: GenerationContext,
  ): Promise<PersonResponse> {
    const resolvedContext = resolveContext(request.seed, context);
    const fullName = await this.#fullNameGenerator.generate(
      { ...request, middleName: false, surnameCount: 1 },
      resolvedContext,
    );

    const age = pickAge(request, resolvedContext);
    const dateOfBirth = pickBirthDate(age, resolvedContext);
    const today = new Date();

    return {
      ...fullName,
      gender: request.gender ?? "any",
      dateOfBirth: dateOfBirth.toISOString().slice(0, 10),
      age: calculateAge(dateOfBirth, today),
    };
  }
}