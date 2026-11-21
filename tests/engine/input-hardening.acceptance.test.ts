import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCard, parseCard, type Card } from '../../src/engine/cards';
import { applyAction, createHand, legalActions, type HandConfig } from '../../src/engine/hand';
import { Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const SIX = [1, 2, 3, 4, 5, 6];
const CARD_NAMES = new Set(DECK.map(formatCard));
const TWO_32 = 2 ** 32;

function config(overrides: Partial<HandConfig> = {}): HandConfig {
  return {
    stakes: STAKES,
    seats: SIX.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: DECK,
    ...overrides,
  };
}

function seatsWithSeat3(stack: number) {
  return SIX.map((seat) => ({ seat, stack: seat === 3 ? stack : 160 }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('input hardening acceptance', () => {
  it('AC#1 parseCard rejects non-strings and echoes at most 10 characters', () => {
    const nonStrings: [unknown, string][] = [
      [undefined, 'undefined'],
      [null, 'object'],
      [51, 'number'],
      [{}, 'object'],
      [['As'], 'object'],
    ];
    for (const [value, type] of nonStrings) {
      const call = () => parseCard(value as unknown as string);
      expect(call).toThrow(RangeError);
      expect(call).toThrow(new RangeError(`Invalid card: expected a string, got ${type}`));
    }

    const long: [string, string][] = [
      ['Asss', 'Invalid card: "Asss"'],
      ['AsKdQhJcTs', 'Invalid card: "AsKdQhJcTs"'],
      ['AsKdQhJcTs9', 'Invalid card: "AsKdQhJcTs..."'],
      ['X'.repeat(100_000), 'Invalid card: "XXXXXXXXXX..."'],
    ];
    for (const [text, message] of long) {
      expect(() => parseCard(text)).toThrow(new RangeError(message));
    }

    fc.assert(
      fc.property(
        fc.string({ maxLength: 200 }).filter((s) => !CARD_NAMES.has(s)),
        (s) => {
          let error: unknown;
          try {
            parseCard(s);
          } catch (caught) {
            error = caught;
          }
          expect(error).toBeInstanceOf(RangeError);
          const message = (error as RangeError).message;
          expect(message).toBe(`Invalid card: "${s.length <= 10 ? s : s.slice(0, 10) + '...'}"`);
          expect(message.length).toBeLessThanOrEqual(29);
        },
      ),
      { numRuns: 2_000 },
    );
  });

  it('AC#2 createHand rejects stakes and stacks that are not safe integers', () => {
    const keys = ['smallBlind', 'bigBlind', 'smallBet', 'bigBet'] as const;
    for (const key of keys) {
      for (const value of [2 ** 53, Number.MAX_SAFE_INTEGER + 2, 2 ** 60]) {
        const stakes = { ...STAKES, [key]: value };
        expect(() => createHand(config({ stakes })), `${key}=${value}`).toThrow(
          new RangeError('Invalid stakes'),
        );
      }
    }
    for (const stack of [2 ** 53, 2 ** 60]) {
      expect(() => createHand(config({ seats: seatsWithSeat3(stack) }))).toThrow(
        new RangeError('Stack at seat 3 must be an integer of at least 5'),
      );
    }
    const state = createHand(config({ seats: seatsWithSeat3(Number.MAX_SAFE_INTEGER - 800) }));
    expect(state.players.find((p) => p.seat === 3)?.startingStack).toBe(
      Number.MAX_SAFE_INTEGER - 800,
    );
    expect(() => createHand(config({ seats: seatsWithSeat3(Number.MAX_SAFE_INTEGER) }))).toThrow(
      new RangeError('Stacks must total at most 9007199254740991'),
    );
  });

  it("AC#3 createHand does not alias the caller's stakes or seats", () => {
    const fresh = () => ({
      stakes: { ...STAKES },
      seats: SIX.map((seat) => ({ seat, stack: 160 })),
      deck: [...DECK],
    });
    const input = fresh();
    const state = createHand({ ...input, button: 1 });
    const before = structuredClone(state);
    const legalBefore = legalActions(state);

    input.stakes.smallBlind = 1000;
    input.stakes.bigBlind = 1000;
    input.stakes.smallBet = 1000;
    input.stakes.bigBet = 1000;
    for (const seat of input.seats) {
      seat.stack = 1;
      seat.seat = 9;
    }
    input.seats.push({ seat: 10, stack: 500 });
    input.deck.reverse();
    input.seats.sort((a, b) => b.stack - a.stack);

    expect(state).toEqual(before);
    expect(state.stakes).not.toBe(input.stakes);
    expect(legalActions(state)).toEqual(legalBefore);

    const twin = createHand({ ...fresh(), button: 1 });
    const action = legalBefore[0];
    expect(action).toBeDefined();
    if (action === undefined) return;
    const next = applyAction(state, action);
    expect(next.ok).toBe(true);
    expect(next).toEqual(applyAction(twin, action));
  });

  it('AC#4 nextIntUnbiased is exact for every n in its documented range and throws outside it', () => {
    for (const n of [0, -1, 1.5, NaN, Infinity, TWO_32 + 1, 2 ** 53]) {
      const rng = new Xoshiro128(1);
      expect(() => rng.nextIntUnbiased(n)).toThrow(
        new RangeError(`nextIntUnbiased needs an integer n from 1 to 2^32, got ${String(n)}`),
      );
    }
    for (const n of [1, 2 ** 21 + 1, 3_000_000_019, TWO_32 - 1, TWO_32]) {
      const rng = new Xoshiro128(1);
      for (let i = 0; i < 1_000; i++) {
        const value = rng.nextIntUnbiased(n);
        expect(Number.isInteger(value) && value >= 0 && value < n, `n=${n}`).toBe(true);
      }
    }

    const source = readFileSync(
      new URL('../../src/engine/seeded-random.ts', import.meta.url),
      'utf8',
    );
    const doc = /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*nextIntUnbiased\(/.exec(source);
    expect(doc).not.toBeNull();
    expect(doc?.[1]).toContain('1..2^32');
    expect(doc?.[1]).toContain('RangeError');

    // The second draw, 2^32 - 1, is always accepted: its low word is 2^32 - n (or 0 when n = 2^32).
    const stubbed = (x: number, n: number) => {
      const rng = new Xoshiro128(1);
      const draws = vi
        .spyOn(rng, 'nextUint32')
        .mockReturnValueOnce(x)
        .mockReturnValueOnce(TWO_32 - 1);
      return { value: rng.nextIntUnbiased(n), draws: draws.mock.calls.length };
    };
    expect(stubbed(4294967295, TWO_32)).toEqual({ value: 4294967295, draws: 1 });
    expect(stubbed(4294967295, 3221225473)).toEqual({
      value: Number((4294967295n * 3221225473n) >> 32n),
      draws: 1,
    });
    expect(Number((4294967295n * 3221225473n) >> 32n)).toBe(3221225472);

    const n = fc.oneof(
      fc.integer({ min: 2 ** 21 + 1, max: TWO_32 }),
      fc.integer({ min: TWO_32 - 1000, max: TWO_32 }),
      fc.integer({ min: 1, max: TWO_32 }),
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: TWO_32 - 1 }), n, (x, size) => {
        const p = BigInt(x) * BigInt(size);
        const low = p & 0xffffffffn;
        const threshold = (2n ** 32n - BigInt(size)) % BigInt(size);
        const { value, draws } = stubbed(x, size);
        if (low >= threshold) {
          expect(draws).toBe(1);
          expect(value).toBe(Number(p >> 32n));
        } else {
          expect(draws).toBe(2);
          expect(value).toBe(Number(((2n ** 32n - 1n) * BigInt(size)) >> 32n));
        }
      }),
      { numRuns: 20_000 },
    );
  });
});
