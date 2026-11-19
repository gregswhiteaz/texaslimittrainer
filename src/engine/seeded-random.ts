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
    return mix32(state);
  };
}

/** The SplitMix32 (MurmurHash3) finaliser. A bijection on 32 bits with mix32(0) = 0. */
function mix32(x: number): number {
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Mixes four unsigned 32-bit seed words into a xoshiro128** state. Bijective; only all-zero maps to all-zero. */
export function mixState128(
  words: readonly [number, number, number, number],
): [number, number, number, number] {
  let [a, b, c, d] = words;
  for (let pass = 0; pass < 2; pass++) {
    b = (b ^ mix32(a)) >>> 0;
    c = (c ^ mix32(b)) >>> 0;
    d = (d ^ mix32(c)) >>> 0;
    a = (a ^ mix32(d)) >>> 0;
  }
  return [a, b, c, d];
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
    // Rotations are inlined: this runs several times per sampled trial.
    const x = Math.imul(this.s1, 5);
    const result = Math.imul((x << 7) | (x >>> 25), 9) >>> 0;
    const t = this.s1 << 9;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = (this.s3 << 11) | (this.s3 >>> 21);
    return result;
  }

  /** Integer in [0, n): Math.floor(nextUint32() * n / 2^32). n is 1..2^31. */
  nextInt(n: number): number {
    return Math.floor((this.nextUint32() * n) / 4294967296);
  }

  /**
   * Integer in [0, n), exactly uniform for every integer n in 1..2^32 (Lemire multiply-shift with
   * rejection, exact 64-bit product). Throws RangeError for any other n.
   */
  nextIntUnbiased(n: number): number {
    if (!Number.isInteger(n) || n < 1 || n > 4294967296) {
      throw new RangeError(`nextIntUnbiased needs an integer n from 1 to 2^32, got ${String(n)}`);
    }
    let [high, low] = multiply32(this.nextUint32(), n);
    if (low < n) {
      // Reject the (2^32 mod n) low values that would make some results more likely.
      const threshold = (4294967296 - n) % n;
      while (low < threshold) {
        [high, low] = multiply32(this.nextUint32(), n);
      }
    }
    return high;
  }
}

/**
 * [floor(x * n / 2^32), x * n mod 2^32] for x in 0..2^32-1 and n in 1..2^32, exact: the product is
 * split into 16-bit halves of n so every intermediate stays below 2^53.
 */
function multiply32(x: number, n: number): [number, number] {
  const nLo = n % 65536;
  const nHi = (n - nLo) / 65536;
  const b = x * nHi;
  const bLo = b % 65536;
  const s = bLo * 65536 + x * nLo;
  const low = s % 4294967296;
  return [(b - bLo) / 65536 + (s - low) / 4294967296, low];
}
