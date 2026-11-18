import { webcrypto } from 'node:crypto';
import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCard } from '../../src/engine/cards';
import {
  isReplayCode,
  newReplayCode,
  replayCodeFromWords,
  shuffledDeck,
} from '../../src/engine/deck';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const FIXED_CODES = [
  '00000000000000000000000000000001',
  'ffffffffffffffffffffffffffffffff',
  '0123456789abcdeffedcba9876543210',
];

const GOLDEN: Record<string, string> = {
  '00000000000000000000000000000001':
    '6h 7s Qs 4h 4c Qd 6d Jd 7c Tc 5c Ks 8h 2h 5s 3d 8d Ts 2c 6s Kc 3s 3h 4s 8c Kd 4d Jh 6c As Ac 5d 9d Qc 5h Kh 9h 7h 9c 7d Ah Jc 2s Js Td 9s Th 2d Ad 3c Qh 8s',
  '00000001000000020000000300000004':
    '5h 4s 6d Ah 5c Ts 4d 7s As 9h Td Ac Qc 9d 6c 6h 9c 5s 3d Tc 2s 7h 2c 6s 8h Kh 8s Ad 3s 8c 8d 2d 5d 7d Ks Qh Js Kc Th Jh 3h Qd Jd Qs 9s 4c 4h Jc Kd 3c 2h 7c',
  '0123456789abcdeffedcba9876543210':
    '6d Qs 8h Ts Ad Qd 4h Jh Tc 6s 2s 7h Js 2h Ks 4c 2d 6c Ah Qh 8d Jd 8c 4d 7d 9s 8s 2c 7s 7c Kc Ac 5c Qc Kh 3s 6h As 9c 3d 9h Td 4s 5s 3h 5d Kd Th Jc 5h 9d 3c',
  ffffffffffffffffffffffffffffffff:
    '5d 5h 9c Jd 6h Ac Th 2s 8s 4h 7c 7h 8c Tc 9d 8h 5s 3c Td Kc Qc 2d 2c 4d Ah Kh 8d 6c 2h 9h 7s Qh Kd 3h 4s Jh Js As Qs Ks 3d Ts 9s 4c Ad 6s 5c Jc 7d 6d Qd 3s',
};

const ALL_CARDS = Array.from({ length: 52 }, (_, card) => card);

const word = fc.integer({ min: 0, max: 0xffffffff });
const validCode = fc
  .tuple(word, word, word, word)
  .filter((words) => words.some((w) => w !== 0))
  .map((words) => replayCodeFromWords(words));

const hexOf = (words: Uint32Array) =>
  Array.from(words, (w) => w.toString(16).padStart(8, '0')).join('');

function chiSquare(counts: number[], total: number): number {
  const expected = total / counts.length;
  return counts.reduce((sum, observed) => sum + (observed - expected) ** 2 / expected, 0);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deck acceptance', () => {
  it('AC#1 every seeded deck holds each of the 52 cards exactly once', () => {
    const check = (code: string) => {
      const deck = shuffledDeck(code);
      expect(deck).toHaveLength(52);
      expect(deck.every((card) => Number.isInteger(card))).toBe(true);
      expect([...deck].sort((a, b) => a - b)).toEqual(ALL_CARDS);
    };
    for (const code of FIXED_CODES) check(code);
    fc.assert(fc.property(validCode, check), { numRuns: 10_000 });
  });

  it('AC#2 first-card position passes a chi-square uniformity test', () => {
    const CRITICAL = 77.386;
    const TOTAL = 100_000;
    const g = new Xoshiro128(2026);
    const positionOfCard0 = new Array<number>(52).fill(0);
    const cardOnTop = new Array<number>(52).fill(0);
    for (let k = 0; k < TOTAL; k++) {
      const code = replayCodeFromWords([
        g.nextUint32(),
        g.nextUint32(),
        g.nextUint32(),
        g.nextUint32(),
      ]);
      const deck = shuffledDeck(code);
      const position = deck.indexOf(0);
      const top = deck[0] as number;
      positionOfCard0[position] = (positionOfCard0[position] ?? 0) + 1;
      cardOnTop[top] = (cardOnTop[top] ?? 0) + 1;
    }
    const sum = (counts: number[]) => counts.reduce((a, b) => a + b, 0);
    expect(sum(positionOfCard0)).toBe(TOTAL);
    expect(sum(cardOnTop)).toBe(TOTAL);
    const chiPosition = chiSquare(positionOfCard0, TOTAL);
    const chiTop = chiSquare(cardOnTop, TOTAL);
    console.log(
      `AC#2 chi-square (df = 51, critical 77.386): position of 2c = ${chiPosition.toFixed(3)}, card on top = ${chiTop.toFixed(3)}`,
    );
    expect(chiPosition).toBeLessThan(CRITICAL);
    expect(chiTop).toBeLessThan(CRITICAL);
  });

  it('AC#3 in Node the seed comes from the node crypto module', () => {
    expect(globalThis.crypto).toBe(webcrypto);
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used');
    });

    const spy = vi.spyOn(webcrypto, 'getRandomValues');
    const code = newReplayCode();
    expect(spy).toHaveBeenCalledTimes(1);
    const filled = spy.mock.calls[0]?.[0];
    expect(filled).toBeInstanceOf(Uint32Array);
    expect((filled as Uint32Array).length).toBe(4);
    expect(code).toBe(hexOf(filled as Uint32Array));
    spy.mockRestore();

    const fixed = vi.spyOn(webcrypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array).set([1, 2, 3, 4]);
      return array;
    });
    expect(newReplayCode()).toBe('00000001000000020000000300000004');
    expect(fixed).toHaveBeenCalledTimes(1);
    fixed.mockRestore();

    const first = newReplayCode();
    const second = newReplayCode();
    expect(isReplayCode(first)).toBe(true);
    expect(isReplayCode(second)).toBe(true);
    expect(first).not.toBe(second);
  });

  it('AC#4 the same replay code gives the same deck order', () => {
    const check = (code: string) => {
      const first = shuffledDeck(code);
      const second = shuffledDeck(code);
      expect(second).toEqual(first);
      expect(second).not.toBe(first);
      const before = [...first];
      first.reverse();
      expect(shuffledDeck(code)).toEqual(before);
    };
    for (const code of FIXED_CODES) check(code);
    fc.assert(fc.property(validCode, check), { numRuns: 1_000 });

    for (const [code, expected] of Object.entries(GOLDEN)) {
      expect(shuffledDeck(code).map(formatCard).join(' ')).toBe(expected);
    }

    expect(shuffledDeck('00000000000000000000000000000001')).not.toEqual(
      shuffledDeck('00000000000000000000000000000002'),
    );
  });
});
