import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  splitPot,
  type Action,
  type HandConfig,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, card) => card);
const SIX = [1, 2, 3, 4, 5, 6];

function config(overrides: Partial<HandConfig> = {}): HandConfig {
  return {
    stakes: STAKES,
    seats: SIX.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: DECK,
    ...overrides,
  };
}

type Step = [SeatNumber, Action['type'], number?];

function apply(state: HandState, [seat, type, amount]: Step): HandState {
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

const play = (state: HandState, ...steps: Step[]) => steps.reduce(apply, state);

function chipsInPlay(state: HandState): number {
  return (
    state.players.reduce((sum, p) => sum + p.stack + p.streetContribution, 0) +
    state.pots.reduce((sum, pot) => sum + pot.amount, 0)
  );
}

describe('hand', () => {
  it('big blind option and raises reopen the round', () => {
    const start = createHand(config());
    expect(start.betCount).toBe(1);
    const option = play(
      start,
      [4, 'call', 4],
      [5, 'call', 4],
      [6, 'call', 4],
      [1, 'call', 4],
      [2, 'call', 2],
    );
    expect(option.street).toBe('preflop');
    expect(option.toAct).toBe(3);
    expect(legalActions(option)).toEqual([
      { seat: 3, type: 'check' },
      { seat: 3, type: 'raise', amount: 8 },
    ]);

    const raised = play(option, [3, 'raise', 8]);
    expect(raised.betCount).toBe(2);
    expect(raised.toAct).toBe(4);
    expect(raised.players.filter((p) => p.hasActed).map((p) => p.seat)).toEqual([3]);
    const called = play(raised, [4, 'call', 4], [5, 'call', 4], [6, 'call', 4], [1, 'call', 4]);
    expect(called.street).toBe('preflop');
    expect(called.toAct).toBe(2);

    const flop = play(called, [2, 'call', 4]);
    expect(flop.street).toBe('flop');
    expect(flop.betCount).toBe(0);
    const bet = play(flop, [2, 'bet', 4]);
    expect(bet.betCount).toBe(1);
    expect(play(bet, [3, 'raise', 8]).betCount).toBe(2);

    const turn = play(
      flop,
      [2, 'check'],
      [3, 'check'],
      [4, 'check'],
      [5, 'check'],
      [6, 'check'],
      [1, 'check'],
    );
    expect(turn.street).toBe('turn');
    expect(turn.betCount).toBe(0);
  });

  it('splitPot distributes odd units clockwise from the left of the button', () => {
    expect(splitPot(29, [3, 5, 6], 4, SIX)).toEqual([
      { seat: 5, amount: 10 },
      { seat: 6, amount: 10 },
      { seat: 3, amount: 9 },
    ]);
    expect(splitPot(27, [5, 2], 1, SIX)).toEqual([
      { seat: 2, amount: 14 },
      { seat: 5, amount: 13 },
    ]);
    expect(splitPot(27, [2, 5], 3, SIX)).toEqual([
      { seat: 5, amount: 14 },
      { seat: 2, amount: 13 },
    ]);
    expect(splitPot(30, [2, 4, 6], 1, SIX).map((w) => w.amount)).toEqual([10, 10, 10]);
    expect(splitPot(31, [4], 6, SIX)).toEqual([{ seat: 4, amount: 31 }]);
    for (let amount = 0; amount < 40; amount++) {
      const shares = splitPot(amount, [1, 3, 4, 6], 3, SIX);
      expect(shares.reduce((sum, w) => sum + w.amount, 0)).toBe(amount);
    }
  });

  it('illegal actions return a typed error and leave the state unchanged', () => {
    const state = createHand(config());
    const before = structuredClone(state);
    expect(applyAction(state, { seat: 5, type: 'call', amount: 4 })).toEqual({
      ok: false,
      error: { code: 'out-of-turn', message: 'Seat 5 acted but seat 4 is to act' },
    });
    const wrong: Action[] = [
      { seat: 4, type: 'raise', amount: 12 },
      { seat: 4, type: 'call', amount: 2 },
      { seat: 4, type: 'bet', amount: 4 },
      { seat: 4, type: 'check' },
    ];
    for (const action of wrong) {
      expect(applyAction(state, action)).toEqual({
        ok: false,
        error: { code: 'illegal-action', message: 'Illegal action for seat 4' },
      });
    }
    expect(state).toEqual(before);

    const done = play(state, [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold'], [2, 'fold']);
    const doneBefore = structuredClone(done);
    expect(applyAction(done, { seat: 3, type: 'check' })).toEqual({
      ok: false,
      error: { code: 'hand-complete', message: 'The hand is complete' },
    });
    expect(done).toEqual(doneBefore);
  });

  it('createHand rejects invalid configs with fixed messages', () => {
    const seats = (list: number[], stack = 160) => list.map((seat) => ({ seat, stack }));
    const cases: [Partial<HandConfig>, string][] = [
      [{ seats: seats([1, 2]) }, 'Hand needs 3 to 10 seats, got 2'],
      [{ seats: seats([...SIX, 7, 8, 9, 10, 11]) }, 'Hand needs 3 to 10 seats, got 11'],
      [{ seats: seats([0, 1, 2]) }, 'Invalid seat: 0'],
      [{ seats: seats([1, 2, 11]) }, 'Invalid seat: 11'],
      [{ seats: seats([1, 2, 2.5]) }, 'Invalid seat: 2.5'],
      [{ seats: seats([1, 2, 2]) }, 'Duplicate seat: 2'],
      [{ seats: seats([2, 3, 4]) }, 'Button must be a dealt-in seat: 1'],
      [{ stakes: { ...STAKES, smallBlind: 0 } }, 'Invalid stakes'],
      [{ stakes: { ...STAKES, bigBet: 8.5 } }, 'Invalid stakes'],
      [{ stakes: { ...STAKES, smallBlind: 5 } }, 'Invalid stakes'],
      [{ stakes: { ...STAKES, bigBlind: 6 } }, 'Invalid stakes'],
      [{ stakes: { ...STAKES, bigBet: 4 } }, 'Invalid stakes'],
      [{ deck: DECK.slice(1) }, 'Deck must hold each of the 52 cards exactly once'],
      [{ deck: [0, ...DECK.slice(1, 51), 0] }, 'Deck must hold each of the 52 cards exactly once'],
      [
        { seats: [...seats([1, 2]), { seat: 3, stack: 4 }] },
        'Stack at seat 3 must be an integer of at least 5',
      ],
      [
        {
          stakes: { smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet: 2 ** 50 },
          seats: seats(SIX, 2 ** 52),
        },
        'Invalid stakes',
      ],
    ];
    for (const [overrides, message] of cases) {
      expect(() => createHand(config(overrides))).toThrow(new RangeError(message));
    }
    const minimum = createHand(config({ seats: seats([1, 2, 3], 96) }));
    const unevenBlinds = { smallBlind: 1, bigBlind: 3, smallBet: 3, bigBet: 6 };
    expect(() => createHand(config({ stakes: unevenBlinds }))).not.toThrow();
    expect(minimum.players.map((p) => p.startingStack)).toEqual([96, 96, 96]);
    const large = { smallBlind: 1, bigBlind: 1, smallBet: 1, bigBet: 2 ** 40 };
    const largeHand = createHand(config({ stakes: large, seats: seats(SIX, 2 ** 44) }));
    expect(largeHand.stakes).toEqual(large);
    expect(largeHand.players.every((p) => p.startingStack === 2 ** 44)).toBe(true);
  });

  it('applyAction is pure and never mutates its input', () => {
    const deck = shuffledDeck('0123456789abcdeffedcba9876543210');
    const deckCopy = [...deck];
    const first = createHand(config({ deck }));
    expect(createHand(config({ deck }))).toEqual(first);
    expect(deck).toEqual(deckCopy);

    const before = structuredClone(first);
    const a = applyAction(first, { seat: 4, type: 'raise', amount: 8 });
    const b = applyAction(first, { seat: 4, type: 'raise', amount: 8 });
    expect(a).toEqual(b);
    expect(first).toEqual(before);

    let state = first;
    expect(chipsInPlay(state)).toBe(960);
    while (state.result === null) {
      const legal = legalActions(state);
      const action = legal.find((x) => x.type === 'call' || x.type === 'check') as Action;
      const previous = state;
      const snapshot = structuredClone(previous);
      state = apply(state, [
        action.seat,
        action.type,
        'amount' in action ? action.amount : undefined,
      ]);
      expect(chipsInPlay(state)).toBe(960);
      expect(previous).toEqual(snapshot);
    }
    expect(state.result.endedBy).toBe('showdown');
    expect(state.board).toHaveLength(5);
    expect(state.players.reduce((sum, p) => sum + p.stack, 0)).toBe(960);
  });

  it('all-in flags, floor and actor order', () => {
    const three = (stacks: [number, number, number]) =>
      createHand(config({ seats: stacks.map((stack, i) => ({ seat: i + 1, stack })) }));
    const allInOf = (state: HandState, seat: SeatNumber) =>
      state.players.find((p) => p.seat === seat)?.allIn;

    expect(three([160, 160, 5]).players[2]?.stack).toBe(1);
    expect(() => three([160, 160, 4])).toThrow(
      new RangeError('Stack at seat 3 must be an integer of at least 5'),
    );

    // Seat 3 (big blind) faces a $4 flop bet with `stack - 4` behind.
    const facing = (stack: number) =>
      play(three([160, 160, stack]), [1, 'call', 4], [2, 'call', 2], [3, 'check'], [2, 'bet', 4]);
    const exactCall = apply(facing(8), [3, 'call', 4]);
    expect(allInOf(exactCall, 3)).toBe(true);
    expect(exactCall.toAct).toBe(1);
    const leavesOne = apply(facing(9), [3, 'call', 4]);
    expect(allInOf(leavesOne, 3)).toBe(false);
    // $6 behind covers the $4 call but not the $8 raise.
    expect(legalActions(facing(10))).toEqual([
      { seat: 3, type: 'fold' },
      { seat: 3, type: 'call', amount: 4 },
    ]);

    const exactRaise = apply(three([8, 160, 160]), [1, 'raise', 8]);
    expect(allInOf(exactRaise, 1)).toBe(true);
    const exactBet = play(
      three([160, 8, 160]),
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'bet', 4],
    );
    expect(allInOf(exactBet, 2)).toBe(true);
    expect(exactBet.toAct).toBe(3);

    // Seat 2, first after the button, goes all-in on the flop; the turn starts with seat 3.
    const shortFirst = play(
      three([160, 7, 160]),
      [1, 'call', 4],
      [2, 'call', 2],
      [3, 'check'],
      [2, 'check'],
      [3, 'bet', 4],
      [1, 'call', 4],
      [2, 'call', 3],
    );
    expect(allInOf(shortFirst, 2)).toBe(true);
    expect(shortFirst.street).toBe('turn');
    expect(shortFirst.toAct).toBe(3);
  });
});
