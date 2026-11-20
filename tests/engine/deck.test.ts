import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  isReplayCode,
  newReplayCode,
  replayCodeFromWords,
  shuffledDeck,
} from '../../src/engine/deck';
import { mixState128, Xoshiro128 } from '../../src/engine/seeded-random';

const GOLDEN_CODES = [
  '00000000000000000000000000000001',
  '00000001000000020000000300000004',
  '0123456789abcdeffedcba9876543210',
  'ffffffffffffffffffffffffffffffff',
];

/** shuffledDeck before TASK-1.21: Fisher-Yates with the double-product nextIntUnbiased. */
function legacyShuffledDeck(code: string): Card[] {
  const word = (k: number) => parseInt(code.slice(8 * k, 8 * k + 8), 16);
  const rng = Xoshiro128.fromState(...mixState128([word(0), word(1), word(2), word(3)]));
  const nextIntUnbiased = (n: number) => {
    let m = rng.nextUint32() * n;
    let low = m % 4294967296;
    if (low < n) {
      const threshold = (4294967296 - n) % n;
      while (low < threshold) {
        m = rng.nextUint32() * n;
        low = m % 4294967296;
      }
    }
    return Math.floor(m / 4294967296);
  };
  const deck: Card[] = Array.from({ length: 52 }, (_, card) => card);
  for (let i = 51; i > 0; i--) {
    const j = nextIntUnbiased(i + 1);
    const card = deck[i] as Card;
    deck[i] = deck[j] as Card;
    deck[j] = card;
  }
  return deck;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deck', () => {
  it('newReplayCode redraws an all-zero seed', () => {
    let calls = 0;
    const mock = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      calls++;
      (array as Uint32Array).set(calls === 1 ? [0, 0, 0, 0] : [1, 2, 3, 4]);
      return array;
    });
    expect(newReplayCode()).toBe('00000001000000020000000300000004');
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('replay codes encode four words as 32 lowercase hex characters', () => {
    expect(replayCodeFromWords([0x01234567, 0x89abcdef, 0xfedcba98, 0x76543210])).toBe(
      '0123456789abcdeffedcba9876543210',
    );
    expect(replayCodeFromWords([0, 0, 0, 1])).toBe('00000000000000000000000000000001');
    expect(replayCodeFromWords([0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff])).toBe(
      'f'.repeat(32),
    );

    const word = fc.integer({ min: 0, max: 0xffffffff });
    fc.assert(
      fc.property(
        fc.tuple(word, word, word, word).filter((words) => words.some((w) => w !== 0)),
        (words) => {
          const code = replayCodeFromWords(words);
          expect(code).toHaveLength(32);
          expect(isReplayCode(code)).toBe(true);
          const parsed = [0, 1, 2, 3].map((k) => parseInt(code.slice(8 * k, 8 * k + 8), 16));
          expect(parsed).toEqual(words);
        },
      ),
      { numRuns: 1_000 },
    );

    const valid = '0123456789abcdeffedcba9876543210';
    const invalid = [
      '',
      '0'.repeat(32),
      valid.slice(1),
      `${valid}0`,
      '0123456789ABCDEFFEDCBA9876543210',
      `0123456789abcdef fedcba987654321`,
    ];
    for (const text of invalid) expect(isReplayCode(text), text).toBe(false);
    for (let i = 0; i < 32; i++) {
      const text = valid.slice(0, i) + 'g' + valid.slice(i + 1);
      expect(isReplayCode(text), text).toBe(false);
    }
    for (const code of GOLDEN_CODES) expect(isReplayCode(code)).toBe(true);
  });

  it('shuffledDeck deals the same decks as before the exact nextIntUnbiased', () => {
    const g = new Xoshiro128(2121);
    const codes = [...GOLDEN_CODES];
    while (codes.length < GOLDEN_CODES.length + 10_000) {
      const words = [g.nextUint32(), g.nextUint32(), g.nextUint32(), g.nextUint32()];
      if (words.some((w) => w !== 0)) codes.push(replayCodeFromWords(words));
    }
    for (const code of codes) expect(shuffledDeck(code), code).toEqual(legacyShuffledDeck(code));
  });

  it('invalid words and codes throw RangeError', () => {
    const badWords = [
      [],
      [1, 2, 3],
      [1, 2, 3, 4, 5],
      [0, 0, 0, 0],
      [-1, 0, 0, 1],
      [2 ** 32, 0, 0, 1],
      [1.5, 0, 0, 1],
      [NaN, 0, 0, 1],
    ];
    for (const words of badWords) {
      expect(() => replayCodeFromWords(words), JSON.stringify(words)).toThrow(
        new RangeError('Invalid replay code words'),
      );
    }

    expect(() => shuffledDeck('ABC')).toThrow(new RangeError('Invalid replay code: "ABC"'));
    expect(() => shuffledDeck('0'.repeat(32))).toThrow(
      new RangeError('Invalid replay code: "0000000000..."'),
    );
    expect(() => shuffledDeck('0123456789ABCDEFFEDCBA9876543210')).toThrow(
      new RangeError('Invalid replay code: "0123456789..."'),
    );
  });
});
