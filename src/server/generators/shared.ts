import type { Generator, NameRecord } from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { createContext } from "../random/prng.ts";
import { UniformSelectionStrategy, WeightedSelectionStrategy } from "../random/selection.ts";
import { ServiceError } from "../validation/errors.ts";

export function resolveContext(seed?: number, context?: GenerationContext): GenerationContext {
    return context ?? createContext(seed);
}

export function chooseRecord<T>(
    items: readonly T[],
    context: GenerationContext,
): T {
    if (items.length === 0) {
        throw new ServiceError(400, "NO_MATCH", "No matching values were found.");
    }
    const weighted = items.some((item) => {
        if (typeof item !== "object" || item === null) {
            return false;
        }
        return "weight" in item && typeof item.weight === "number";
    })
        ? new WeightedSelectionStrategy<T>((item) => {
            if (typeof item !== "object" || item === null || !("weight" in item)) {
                return 1;
            }
            return typeof item.weight === "number" ? item.weight : 1;
        })
        : new UniformSelectionStrategy<T>();
    return weighted.select(items, context.rng);
}

export function chooseValue(items: readonly string[], context: GenerationContext): string {
    if (items.length === 0) {
        throw new ServiceError(400, "NO_MATCH", "No matching values were found.");
    }
    return new UniformSelectionStrategy<string>().select(items, context.rng);
}

export function formatNoMatch(message: string): never {
    throw new ServiceError(400, "NO_MATCH", message);
}

export type AsyncGenerator<TRequest, TResult> = Generator<TRequest, TResult>;

export function nameToValue(record: string | NameRecord): string {
    return typeof record === "string" ? record : record.value;
}