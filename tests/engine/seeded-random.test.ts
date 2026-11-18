import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { fnv1a32, mixState128, splitMix32, Xoshiro128 } from '../../src/engine/seeded-random';

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

  it('nextIntUnbiased is in range and rejects only the biased zone', () => {
    const raw = Xoshiro128.fromState(1, 2, 3, 4);
    expect(take(() => raw.nextUint32(), 6)).toEqual([
      11520, 0, 5927040, 70819200, 2031721883, 1637235492,
    ]);
    const fixed = Xoshiro128.fromState(1, 2, 3, 4);
    expect(take(() => fixed.nextIntUnbiased(52), 5)).toEqual([0, 0, 0, 24, 19]);

    const stubbed = Xoshiro128.fromState(1, 2, 3, 4);
    const draws = vi.spyOn(stubbed, 'nextUint32').mockReturnValueOnce(0).mockReturnValueOnce(5);
    expect(stubbed.nextIntUnbiased(3)).toBe(Math.floor(15 / 2 ** 32));
    expect(draws).toHaveBeenCalledTimes(2);

    for (const n of [1, 2, 52, 1326, 2 ** 31]) {
      const rng = new Xoshiro128(n);
      const seen = new Set<number>();
      for (let i = 0; i < 10_000; i++) {
        const value = rng.nextIntUnbiased(n);
        expect(Number.isInteger(value) && value >= 0 && value < n).toBe(true);
        seen.add(value);
      }
      if (n === 52) expect(seen.size).toBe(52);
    }
  });

  it('mixState128 matches reference vectors and keeps the state non-zero', () => {
    expect(mixState128([0, 0, 0, 1])).toEqual([2113565907, 804215951, 1461123477, 215606639]);
    expect(mixState128([1, 2, 3, 4])).toEqual([2596147925, 1707097829, 2530956364, 2107774845]);
    expect(mixState128([0x01234567, 0x89abcdef, 0xfedcba98, 0x76543210])).toEqual([
      3040342894, 2181108681, 1539535247, 3909763452,
    ]);
    expect(mixState128([0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff])).toEqual([
      753140462, 1665157609, 1069552014, 3131831619,
    ]);
    expect(mixState128([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);

    const word = fc.integer({ min: 0, max: 0xffffffff });
    const words = fc.tuple(word, word, word, word);
    fc.assert(
      fc.property(
        words.filter((w) => w.some((x) => x !== 0)),
        (w) => {
          const state = mixState128(w);
          expect(state.every((x) => Number.isInteger(x) && x >= 0 && x <= 0xffffffff)).toBe(true);
          expect(state.some((x) => x !== 0)).toBe(true);
        },
      ),
      { numRuns: 1_000 },
    );
    fc.assert(
      fc.property(
        fc.tuple(words, words).filter(([a, b]) => a.some((x, i) => x !== b[i])),
        ([a, b]) => {
          expect(mixState128(a)).not.toEqual(mixState128(b));
        },
      ),
      { numRuns: 1_000 },
    );

    expect(take(splitMix32(0), 4)).toEqual([2462723854, 1020716019, 454327756, 1275600319]);
  });
});
