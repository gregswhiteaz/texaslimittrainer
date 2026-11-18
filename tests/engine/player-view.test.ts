import { describe, expect, it, vi } from 'vitest';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import {
  actWith,
  playerView,
  showdownOf,
  type EarlierShowdown,
  type PlayerView,
} from '../../src/engine/player-view';

const REVERSED = Array.from({ length: 52 }, (_, i) => 51 - i);

function newHand(): HandState {
  return createHand({
    stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: REVERSED,
  });
}

type Step = [SeatNumber, Action['type'], number?];

function play(state: HandState, ...steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];
const CHECK_AROUND: Step[] = [2, 3, 4, 5, 6, 1].map((seat) => [seat, 'check']);
const SEATS = [1, 2, 3, 4, 5, 6];

/** Seat 3 to act on the flop after everyone limped and seat 2 checked. */
const workedExample = () => play(newHand(), ...LIMP_6, [2, 'check']);
const showdownHand = () =>
  play(newHand(), ...LIMP_6, ...CHECK_AROUND, ...CHECK_AROUND, ...CHECK_AROUND);
const foldOutHand = () =>
  play(newHand(), [4, 'fold'], [5, 'fold'], [6, 'fold'], [1, 'fold'], [2, 'fold']);

function objectsIn(value: unknown, found = new Set<object>()): Set<object> {
  if (typeof value === 'object' && value !== null && !found.has(value)) {
    found.add(value);
    for (const child of Object.values(value)) objectsIn(child, found);
  }
  return found;
}

function mutate(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(mutate);
    value.push(99);
    value.reverse();
  } else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      mutate(record[key]);
      record[key] = 'changed';
    }
  }
}

const publicPart = (view: PlayerView) => ({ ...view, seat: 0, holeCards: [], legalActions: [] });

describe('playerView', () => {
  it('copies everything and never mutates the state', () => {
    const earlier: EarlierShowdown[] = [showdownOf(showdownHand()) as EarlierShowdown];
    for (const state of [workedExample(), play(newHand(), [4, 'fold'], [5, 'raise', 8])]) {
      const clone = structuredClone(state);
      const stateObjects = objectsIn(state);
      for (const seat of SEATS) {
        const view = playerView(state, seat, earlier);
        expect(view.earlierShowdowns).toBe(earlier);
        // earlierShowdowns is shared with the caller by design (A-3).
        const rest = { ...view, earlierShowdowns: [] };
        for (const object of objectsIn(rest)) expect(stateObjects.has(object)).toBe(false);
        mutate(rest);
      }
      expect(state).toEqual(clone);
    }
  });

  it('seats not to act, folded seats and completed hands', () => {
    const state = workedExample();
    const seat3 = playerView(state, 3);
    const seat5 = playerView(state, 5);
    expect(seat5.seat).toBe(5);
    expect(seat5.holeCards).toEqual([48, 42]);
    expect(seat5.legalActions).toEqual([]);
    expect(publicPart(seat5)).toEqual(publicPart(seat3));

    const afterFold = play(newHand(), [4, 'fold']);
    const folded = playerView(afterFold, 4);
    expect(folded.holeCards).toEqual([49, 43]);
    expect(folded.players.find((p) => p.seat === 4)?.folded).toBe(true);
    expect(folded.legalActions).toEqual([]);
    expect(playerView(afterFold, 5).legalActions.length).toBeGreaterThan(0);

    for (const done of [showdownHand(), foldOutHand()]) {
      for (const seat of SEATS) {
        const view = playerView(done, seat);
        expect(view.toAct).toBeNull();
        expect(view.legalActions).toEqual([]);
        expect(view).not.toHaveProperty('result');
      }
    }
  });
});

describe('actWith', () => {
  it('returns typed errors and skips the policy on a completed hand', () => {
    expect(() => playerView(newHand(), 7)).toThrow(new RangeError('Seat 7 is not dealt in'));

    const policy = vi.fn((): Action => ({ seat: 3, type: 'check' }));
    expect(actWith(showdownHand(), policy)).toEqual({
      ok: false,
      error: { code: 'hand-complete', message: 'The hand is complete' },
    });
    expect(policy).not.toHaveBeenCalled();

    const state = workedExample();
    const before = structuredClone(state);
    const illegal = actWith(state, () => ({ seat: 3, type: 'bet', amount: 8 }));
    expect(illegal.ok).toBe(false);
    if (!illegal.ok) expect(illegal.error.code).toBe('illegal-action');
    const wrongSeat = actWith(state, () => ({ seat: 4, type: 'check' }));
    expect(wrongSeat.ok).toBe(false);
    if (!wrongSeat.ok) expect(wrongSeat.error.code).toBe('out-of-turn');
    expect(state).toEqual(before);
  });
});

describe('showdownOf', () => {
  it('lists shown hands and is null otherwise', () => {
    const done = showdownHand();
    const shown = showdownOf(done);
    expect(shown).toEqual({
      shown: done.result?.showdown.map((s) => ({ seat: s.seat, holeCards: s.holeCards })),
    });
    expect(shown?.shown.map((s) => s.seat)).toEqual([2, 3, 4, 5, 6, 1]);

    expect(showdownOf(foldOutHand())).toBeNull();
    expect(showdownOf(workedExample())).toBeNull();
  });
});
