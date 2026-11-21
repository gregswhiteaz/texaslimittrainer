import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandConfig,
  type HandState,
  type Stakes,
} from '../../src/engine/hand';

const MAX = Number.MAX_SAFE_INTEGER;
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TOTAL_ERROR = new RangeError('Stacks must total at most 9007199254740991');
const ACTION_LIMIT = 10_000;
const PREFERENCE: Action['type'][] = ['raise', 'bet', 'call', 'check'];

function boundStakes(s: number): Stakes {
  return { smallBlind: s, bigBlind: s, smallBet: s, bigBet: s + 1 };
}

function config(overrides: Partial<HandConfig> = {}): HandConfig {
  return {
    stakes: boundStakes(2 ** 45),
    seats: TEN.map((seat) => ({ seat, stack: seat === 10 ? 900719925474100 : 900719925474099 })),
    button: 1,
    deck: DECK,
    ...overrides,
  };
}

/** Every chip amount in the state must be a safe integer, and chips in play must equal `total`. */
function checkChips(state: HandState, total: number): void {
  const amounts = [
    state.currentBet,
    ...state.players.flatMap((p) => [
      p.startingStack,
      p.stack,
      p.streetContribution,
      p.totalContribution,
    ]),
    ...state.pots.map((pot) => pot.amount),
    ...state.actions.flatMap((record) => [record.amount, record.added]),
    ...(state.result?.awards ?? []).flatMap((award) => [
      award.amount,
      ...award.winners.map((w) => w.amount),
    ]),
  ];
  expect(amounts.filter((value) => !Number.isSafeInteger(value))).toEqual([]);
  const held = state.players.reduce((sum, p) => sum + p.stack + p.streetContribution, 0);
  expect(held + state.pots.reduce((sum, pot) => sum + pot.amount, 0)).toBe(total);
}

/** Plays to the end with `choose`, checking chip amounts after every step. */
function playOut(state: HandState, total: number, choose: (legal: Action[]) => Action) {
  checkChips(state, total);
  for (let steps = 0; state.result === null; steps++) {
    expect(steps, 'action limit').toBeLessThan(ACTION_LIMIT);
    const result = applyAction(state, choose([...legalActions(state)]));
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
    checkChips(state, total);
  }
  return state;
}

const aggressive = (legal: Action[]) =>
  PREFERENCE.flatMap((type) => legal.filter((a) => a.type === type))[0] ?? (legal[0] as Action);

describe('chip safety acceptance', () => {
  it('AC#1 the worst legal hand at the stack bound keeps every chip amount a safe integer', () => {
    const start = createHand(config());
    expect(start.players.reduce((sum, p) => sum + p.startingStack, 0)).toBe(MAX);
    const end = playOut(start, MAX, aggressive);
    expect(end.street).toBe('showdown');
    const awarded = (end.result?.awards ?? []).reduce((sum, award) => sum + award.amount, 0);
    expect(awarded).toBeGreaterThan(0.9 * MAX);
  });

  it('AC#1 random legal play from any accepted config keeps chip amounts safe', () => {
    const scenario = fc
      .tuple(fc.integer({ min: 3, max: 10 }), fc.integer({ min: 2 ** 44, max: 2 ** 45 }))
      .chain(([n, s]) =>
        fc.record({
          s: fc.constant(s),
          stacks: fc.array(fc.integer({ min: 16 * s + 8, max: Math.floor(MAX / n) }), {
            minLength: n,
            maxLength: n,
          }),
          button: fc.integer({ min: 1, max: n }),
          code: fc.stringMatching(/^[0-9a-f]{32}$/).filter((code) => /[1-9a-f]/.test(code)),
          picks: fc.infiniteStream(fc.nat()),
        }),
      );
    fc.assert(
      fc.property(scenario, ({ s, stacks, button, code, picks }) => {
        const seats = stacks.map((stack, i) => ({ seat: i + 1, stack }));
        const deck = shuffledDeck(code);
        const start = createHand({ stakes: boundStakes(s), seats, button, deck });
        const total = stacks.reduce((sum, stack) => sum + stack, 0);
        expect(total).toBeLessThanOrEqual(MAX);
        const pick = picks[Symbol.iterator]();
        playOut(start, total, (legal) => legal[pick.next().value % legal.length] as Action);
      }),
      { numRuns: 100 },
    );
  });

  it('AC#1 createHand rejects stacks that total more than MAX_SAFE_INTEGER', () => {
    const over = TEN.map((seat) => ({
      seat,
      stack: seat === 10 ? 900719925474101 : 900719925474099,
    }));
    expect(() => createHand(config({ seats: over }))).toThrow(TOTAL_ERROR);

    const judge = config({
      stakes: { smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet: 112589990684261 },
      seats: TEN.map((seat) => ({ seat, stack: MAX })),
    });
    expect(() => createHand(judge)).toThrow(TOTAL_ERROR);

    const unsafe = config({
      stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
      seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: seat === 3 ? 2 ** 53 : 160 })),
    });
    expect(() => createHand(unsafe)).toThrow(
      new RangeError('Stack at seat 3 must be an integer of at least 5'),
    );
  });

  it('AC#2 the A-4 stakes bound pins the factor 10', () => {
    const hand = (bigBet: number, count: number, stack: number) =>
      createHand({
        ...config(),
        stakes: { smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet },
        seats: Array.from({ length: count }, (_, i) => ({ seat: i + 1, stack })),
      });
    const invalid = new RangeError('Invalid stakes');
    expect(() => hand(2 ** 49, 6, 2 ** 52)).toThrow(invalid);
    expect(() => hand(112589990684262, 3, 900719925474104)).toThrow(invalid);
    expect(hand(112589990684261, 3, 900719925474096).stakes.bigBet).toBe(112589990684261);
  });

  it('AC#3 createHand reads each config field exactly once', () => {
    const counts = new Map<string, number>();
    const count = (key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);
    const oneShot = <T extends object>(prefix: string, values: Record<string, number>): T => {
      const target = {};
      for (const [key, value] of Object.entries(values)) {
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            const name = `${prefix}.${key}`;
            count(name);
            if (counts.get(name) !== 1) throw new Error(`${name} read twice`);
            return value;
          },
        });
      }
      return target as T;
    };

    const stakeValues = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
    const stacks = [160, 170, 180, 190, 200, 210];
    const target: HandConfig = {
      stakes: oneShot<Stakes>('stakes', stakeValues),
      seats: stacks.map((stack, i) => oneShot(`seat${i + 1}`, { seat: i + 1, stack })),
      button: 1,
      deck: DECK,
    };
    const fields = new Set(['stakes', 'seats', 'button', 'deck']);
    const proxy = new Proxy(target, {
      get(obj, key, receiver) {
        if (typeof key === 'string' && fields.has(key)) count(key);
        return Reflect.get(obj, key, receiver) as unknown;
      },
    });

    const state = createHand(proxy);
    expect(state.stakes).toEqual(stakeValues);
    expect(state.players.map((p) => p.startingStack)).toEqual(stacks);

    const expected = [
      ...fields,
      ...Object.keys(stakeValues).map((key) => `stakes.${key}`),
      ...stacks.flatMap((_, i) => [`seat${i + 1}.seat`, `seat${i + 1}.stack`]),
    ];
    expect(new Map(expected.map((key) => [key, 1]))).toEqual(counts);
  });
});
