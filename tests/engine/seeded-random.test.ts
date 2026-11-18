import { describe, expect, it } from 'vitest';
import { fnv1a32, splitMix32, Xoshiro128 } from '../../src/engine/seeded-random';

function take(next: () => number, count: number): number[] {
  return Array.from({ length: count }, () => next());
}

describe('seeded random', () => {
  it('hash and generators match reference vectors', () => {
    expect(fnv1a32('')).toBe(2166136261);
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);

    expect(take(splitMix32(0), 4)).toEqual([2462723854, 1020716019, 454327756, 1275600319]);

    const fixed = Xoshiro128.fromState(1, 2, 3, 4);
    expect(take(() => fixed.nextUint32(), 5)).toEqual([11520, 0, 5927040, 70819200, 2031721883]);
    const seeded = new Xoshiro128(0);
    expect(take(() => seeded.nextUint32(), 3)).toEqual([3809008728, 1133695204, 53579671]);

    for (const n of [1, 2, 52, 1326]) {
      const rng = new Xoshiro128(n);
      const seen = new Set<number>();
      for (let i = 0; i < 10_000; i++) {
        const value = rng.nextInt(n);
        expect(Number.isInteger(value) && value >= 0 && value < n).toBe(true);
        seen.add(value);
      }
      if (n === 52) expect(seen.size).toBe(52);
    }
  });

  it('nextInt stays in range at the largest n and for extreme outputs', () => {
    const max = 2 ** 31;
    const high = Xoshiro128.fromState(-1, -1, -1, -1);
    for (let i = 0; i < 1000; i++) {
      const value = high.nextInt(max);
      expect(value >= 0 && value < max).toBe(true);
    }
    expect(Xoshiro128.fromState(1, 0, 3, 4).nextInt(max)).toBe(0);
  });
});
