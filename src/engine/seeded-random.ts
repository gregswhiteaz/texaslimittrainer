// Small seeded generators for reproducible results. Not suitable for security uses.

/** FNV-1a 32-bit hash over UTF-16 code units. Unsigned 32-bit result. */
export function fnv1a32(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** SplitMix32 (golden-ratio increment, MurmurHash3 finaliser). Unsigned 32-bit outputs. */
export function splitMix32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x9e3779b9) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

function rotl(x: number, k: number): number {
  return (x << k) | (x >>> (32 - k));
}

/** xoshiro128** by Blackman and Vigna. */
export class Xoshiro128 {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  /** State = the first four outputs of splitMix32(seed). */
  constructor(seed: number) {
    const next = splitMix32(seed);
    this.s0 = next();
    this.s1 = next();
    this.s2 = next();
    this.s3 = next();
  }

  static fromState(s0: number, s1: number, s2: number, s3: number): Xoshiro128 {
    const rng = new Xoshiro128(0);
    rng.s0 = s0 | 0;
    rng.s1 = s1 | 0;
    rng.s2 = s2 | 0;
    rng.s3 = s3 | 0;
    return rng;
  }

  nextUint32(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;
    const t = this.s1 << 9;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  /** Integer in [0, n): Math.floor(nextUint32() * n / 2^32). n is 1..2^31. */
  nextInt(n: number): number {
    return Math.floor((this.nextUint32() * n) / 4294967296);
  }
}
