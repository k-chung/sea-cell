// Seeded random numbers (mulberry32). ALL game randomness must come through here,
// so the same seed + the same actions always replay the same run.
// The RNG state lives inside GameState, so saving the state saves the RNG too.

export interface RngState {
  /** Current internal state. Changes every time a number is drawn. */
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed | 0 };
}

/** A number from 0 (inclusive) to 1 (exclusive). Advances the RNG. */
export function random(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) | 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Whole number from min to max, both included. */
export function randomInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(random(rng) * (max - min + 1));
}

/** True with the given percent chance (0-100). */
export function rollPercent(rng: RngState, percent: number): boolean {
  return random(rng) * 100 < percent;
}

export function pick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick(): cannot pick from an empty list');
  return items[Math.floor(random(rng) * items.length)] as T;
}

/** Returns a shuffled copy; the input is not changed. */
export function shuffle<T>(rng: RngState, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random(rng) * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/** A fresh random seed for a new run (the only place Math.random is allowed). */
export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
