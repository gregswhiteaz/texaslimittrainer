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

  /** Integer in [0, n), exactly uniform (Lemire multiply-shift with rejection). n is 1..2^31. */
  nextIntUnbiased(n: number): number {
    let m = this.nextUint32() * n;
    let low = m % 4294967296;
    if (low < n) {
      // Reject the (2^32 mod n) low values that would make some results more likely.
      const threshold = (4294967296 - n) % n;
      while (low < threshold) {
        m = this.nextUint32() * n;
        low = m % 4294967296;
      }
    }
    return Math.floor(m / 4294967296);
  }
}
