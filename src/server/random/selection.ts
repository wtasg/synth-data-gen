import type { RandomSource } from "./prng.ts";

export interface SelectionStrategy<T> {
  select(items: readonly T[], rng: RandomSource): T;
}

export class UniformSelectionStrategy<T> implements SelectionStrategy<T> {
  select(items: readonly T[], rng: RandomSource): T {
    if (items.length === 0) {
      throw new RangeError("Cannot select from an empty collection");
    }
    return items[rng.int(items.length)];
  }
}

export class WeightedSelectionStrategy<T> implements SelectionStrategy<T> {
  readonly #weightOf: (item: T) => number;

  constructor(weightOf: (item: T) => number) {
    this.#weightOf = weightOf;
  }

  select(items: readonly T[], rng: RandomSource): T {
    if (items.length === 0) {
      throw new RangeError("Cannot select from an empty collection");
    }

    let totalWeight = 0;
    for (const item of items) {
      totalWeight += Math.max(0, this.#weightOf(item));
    }

    if (totalWeight <= 0) {
      return items[rng.int(items.length)];
    }

    let cursor = rng.next() * totalWeight;
    for (const item of items) {
      cursor -= Math.max(0, this.#weightOf(item));
      if (cursor <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }
}