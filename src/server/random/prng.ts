export interface RandomSource {
  next(): number;
  int(maxExclusive: number): number;
}

export interface GenerationContext {
  readonly seed?: number;
  readonly rng: RandomSource;
}

class Mulberry32 implements RandomSource {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  next(): number {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0;
    let t = this.#state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError("maxExclusive must be a positive integer");
    }
    return Math.floor(this.next() * maxExclusive);
  }
}

function randomSeed(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0];
}

export function createContext(seed?: number): GenerationContext {
  const resolvedSeed = seed ?? randomSeed();
  return {
    seed,
    rng: new Mulberry32(resolvedSeed),
  };
}