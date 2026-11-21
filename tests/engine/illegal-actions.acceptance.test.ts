import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Card } from '../../src/engine/cards';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  STREET_BET_CAP,
  type Action,
  type ApplyErrorCode,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../../src/engine/hand';
import { mixState128, Xoshiro128 } from '../../src/engine/seeded-random';

const STAKES_4_8: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);

function newHand(size: number, button: SeatNumber): HandState {
  return createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button,
    deck: DECK,
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

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Freezes the input, applies the action and checks a typed rejection with a JSON-identical state. */
function expectRejected(state: HandState, action: Action, code: ApplyErrorCode): void {
  deepFreeze(state);
  deepFreeze(action);
  const before = JSON.stringify(state);
  const result = applyAction(state, action);
  expect(result).toStrictEqual({ ok: false, error: { code, message: expect.any(String) } });
  expect('state' in result).toBe(false);
  if (!result.ok) expect(result.error.message.length).toBeGreaterThan(0);
  expect(JSON.stringify(state)).toBe(before);
}

/** expectRejected plus a structural comparison and a legal follow-up on the state and its pre-call clone. */
function expectUnchanged(state: HandState, action: Action, code: ApplyErrorCode): void {
  const clone = structuredClone(state);
  expectRejected(state, action, code);
  expect(state).toStrictEqual(clone);
  const followUp = legalActions(clone)[0] as Action;
  expect(applyAction(state, followUp)).toStrictEqual(applyAction(clone, followUp));
}

function expectAccepted(state: HandState, action: Action): void {
  expect(applyAction(state, action).ok).toBe(true);
}

/** 6 seats, button 1: seat 2 SB, seat 3 BB, seat 4 to act. */
function preflopOpening(): HandState {
  return newHand(6, 1);
}

/** Everyone limps and the small blind completes: seat 3 (BB) to act, owing 0 with currentBet 4. */
function bigBlindOption(): HandState {
  return play(
    preflopOpening(),
    [4, 'call', 4],
    [5, 'call', 4],
    [6, 'call', 4],
    [1, 'call', 4],
    [2, 'call', 2],
  );
}

describe('TASK-1.13 illegal actions', () => {
  it('AC#1 an action from a seat that is not to act returns out-of-turn and leaves the state byte-identical', () => {
    const opening = newHand(6, 6);
    expect(opening.toAct).toBe(3);
    const preflopTries: Action[] = [
      { seat: 5, type: 'fold' },
      { seat: 5, type: 'check' },
      { seat: 5, type: 'call', amount: 4 },
      { seat: 5, type: 'call', amount: 0 },
      { seat: 5, type: 'bet', amount: 4 },
      { seat: 5, type: 'raise', amount: 8 },
      { seat: 5, type: 'raise', amount: 12 },
    ];
    for (const action of preflopTries) expectUnchanged(newHand(6, 6), action, 'out-of-turn');

    const flop = (): HandState =>
      play(
        newHand(6, 6),
        [3, 'call', 4],
        [4, 'call', 4],
        [5, 'call', 4],
        [6, 'call', 4],
        [1, 'fold'],
        [2, 'check'],
        [2, 'check'],
      );
    const flopState = flop();
    expect(flopState.street).toBe('flop');
    expect(flopState.toAct).toBe(3);
    expect(flopState.currentBet).toBe(0);
    const flopTries: Action[] = [
      { seat: 5, type: 'check' },
      { seat: 5, type: 'bet', amount: 4 },
      { seat: 5, type: 'fold' },
    ];
    for (const action of flopTries) expectUnchanged(flop(), action, 'out-of-turn');
    expectAccepted(flop(), { seat: 3, type: 'check' });
  });

  it('AC#2 preflop bets and raises of any size other than a $4 raise are rejected and leave the state unchanged', () => {
    const opening = preflopOpening();
    expect(opening.toAct).toBe(4);
    expect(legalActions(opening)).toContainEqual({ seat: 4, type: 'raise', amount: 8 });

    for (const amount of [0, 1, 4, 6, 7, 9, 10, 12, 16, 8.5, -8, NaN, Infinity]) {
      expectUnchanged(preflopOpening(), { seat: 4, type: 'raise', amount }, 'illegal-action');
    }
    for (const amount of [0, 4, 8, 12]) {
      expectUnchanged(preflopOpening(), { seat: 4, type: 'bet', amount }, 'illegal-action');
    }

    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ min: -1000, max: 1000 }), fc.double()).filter((n) => n !== 8),
        fc.constantFrom('raise' as const, 'bet' as const),
        (amount, type) => {
          expectRejected(preflopOpening(), { seat: 4, type, amount }, 'illegal-action');
        },
      ),
      { numRuns: 500 },
    );

    const afterRaise = (): HandState => play(preflopOpening(), [4, 'raise', 8]);
    expect(afterRaise().toAct).toBe(5);
    expect(afterRaise().betCount).toBe(2);
    expect(legalActions(afterRaise())).toContainEqual({ seat: 5, type: 'raise', amount: 12 });
    for (const amount of [16, 8]) {
      expectUnchanged(afterRaise(), { seat: 5, type: 'raise', amount }, 'illegal-action');
    }

    const option = bigBlindOption();
    expect(option.toAct).toBe(3);
    expect(option.currentBet).toBe(4);
    expectUnchanged(bigBlindOption(), { seat: 3, type: 'raise', amount: 12 }, 'illegal-action');
    expectUnchanged(bigBlindOption(), { seat: 3, type: 'bet', amount: 4 }, 'illegal-action');

    expectAccepted(preflopOpening(), { seat: 4, type: 'raise', amount: 8 });
  });

  it('AC#3 a raise on a capped street is rejected and leaves the state unchanged', () => {
    const preflopCap = (): HandState =>
      play(preflopOpening(), [4, 'raise', 8], [5, 'raise', 12], [6, 'raise', 16]);
    const capped = preflopCap();
    expect(capped.betCount).toBe(STREET_BET_CAP);
    expect(capped.toAct).toBe(1);
    expect(legalActions(capped)).toEqual([
      { seat: 1, type: 'fold' },
      { seat: 1, type: 'call', amount: 16 },
    ]);
    for (const amount of [20, 24, 16]) {
      expectUnchanged(preflopCap(), { seat: 1, type: 'raise', amount }, 'illegal-action');
    }

    const turnCap = (): HandState =>
      play(
        newHand(3, 3),
        [3, 'call', 4],
        [1, 'call', 2],
        [2, 'check'],
        [1, 'check'],
        [2, 'check'],
        [3, 'check'],
        [1, 'bet', 8],
        [2, 'raise', 16],
        [3, 'raise', 24],
        [1, 'raise', 32],
      );
    const turn = turnCap();
    expect(turn.street).toBe('turn');
    expect(turn.betCount).toBe(STREET_BET_CAP);
    expect(turn.toAct).toBe(2);
    expect(legalActions(turn)).toEqual([
      { seat: 2, type: 'fold' },
      { seat: 2, type: 'call', amount: 16 },
    ]);
    for (const amount of [40, 36]) {
      expectUnchanged(turnCap(), { seat: 2, type: 'raise', amount }, 'illegal-action');
    }
  });

  it('AC#4 folding when no bet is faced is rejected and leaves the state unchanged', () => {
    const unbetFlop = (): HandState => play(bigBlindOption(), [3, 'check']);
    const flop = unbetFlop();
    expect(flop.street).toBe('flop');
    expect(flop.toAct).toBe(2);
    expect(flop.currentBet).toBe(0);
    expectUnchanged(unbetFlop(), { seat: 2, type: 'fold' }, 'illegal-action');
    expectAccepted(unbetFlop(), { seat: 2, type: 'check' });

    const afterCheck = (): HandState => play(unbetFlop(), [2, 'check']);
    expect(afterCheck().toAct).toBe(3);
    expect(afterCheck().currentBet).toBe(0);
    expectUnchanged(afterCheck(), { seat: 3, type: 'fold' }, 'illegal-action');
    expectAccepted(afterCheck(), { seat: 3, type: 'check' });

    expectUnchanged(bigBlindOption(), { seat: 3, type: 'fold' }, 'illegal-action');
    expectAccepted(bigBlindOption(), { seat: 3, type: 'check' });
  });

  it('AC#5 100,000 random states reject every injected illegal action and stay byte-identical', () => {
    const TARGET = 100_000;
    const rng = Xoshiro128.fromState(...mixState128([1313, 2026, 17, 4]));
    const counts = {
      'out-of-turn': 0,
      'wrong-amount': 0,
      'unoffered-type': 0,
      'capped-raise': 0,
      'fold-unfaced': 0,
      'hand-complete': 0,
    };
    type Kind = Exclude<keyof typeof counts, 'hand-complete'>;
    const TYPES: Action['type'][] = ['fold', 'check', 'call', 'bet', 'raise'];
    let injected = 0;

    const dealHand = (): HandState => {
      const n = 2 + rng.nextInt(9);
      const button = 1 + rng.nextInt(n);
      const seats = Array.from({ length: n }, (_, i) => ({
        seat: i + 1,
        stack: 5 + rng.nextInt(196),
      }));
      const words = [rng.nextUint32(), rng.nextUint32(), rng.nextUint32(), rng.nextUint32()];
      return createHand({
        stakes: STAKES_4_8,
        seats,
        button,
        deck: shuffledDeck(replayCodeFromWords(words)),
      });
    };

    const unofferedType = (
      state: HandState,
      seat: SeatNumber,
      legal: readonly Action[],
      owe: number,
      unit: number,
    ): Action => {
      const missing = TYPES.filter((t) => !legal.some((a) => a.type === t));
      const type = missing[rng.nextInt(missing.length)] as Action['type'];
      if (type === 'fold' || type === 'check') return { seat, type };
      const amount =
        type === 'call' ? (owe > 0 ? owe : unit) : type === 'bet' ? unit : state.currentBet + unit;
      return { seat, type, amount };
    };

    while (injected < TARGET) {
      let state = dealHand();
      while (state.result === null && injected < TARGET) {
        const seat = state.toAct as SeatNumber;
        const player = state.players.find((p) => p.seat === seat);
        if (player === undefined) throw new Error(`seat ${seat} to act is not dealt`);
        const owe = state.currentBet - player.streetContribution;
        const unit =
          state.street === 'preflop' || state.street === 'flop'
            ? state.stakes.smallBet
            : state.stakes.bigBet;
        const legal = legalActions(state);
        const kinds: Kind[] = ['out-of-turn', 'wrong-amount', 'unoffered-type'];
        if (state.betCount >= STREET_BET_CAP && owe > 0) kinds.push('capped-raise');
        if (owe <= 0) kinds.push('fold-unfaced');
        let kind = kinds[rng.nextInt(kinds.length)] as Kind;

        let action: Action;
        let code: ApplyErrorCode = 'illegal-action';
        if (kind === 'out-of-turn') {
          const draw = 1 + rng.nextInt(9);
          const other = draw >= seat ? draw + 1 : draw;
          action = { ...(legal[rng.nextInt(legal.length)] as Action), seat: other };
          code = 'out-of-turn';
        } else if (kind === 'wrong-amount') {
          const bearing = legal.filter((a) => 'amount' in a);
          const picked = bearing[rng.nextInt(bearing.length)];
          if (picked !== undefined && 'amount' in picked) {
            const a = picked.amount;
            const options = [a + 1, a - 1, a + unit, 0, -a, a + 0.5, NaN, Infinity];
            action = { ...picked, amount: options[rng.nextInt(options.length)] as number };
          } else {
            kind = 'unoffered-type';
            action = unofferedType(state, seat, legal, owe, unit);
          }
        } else if (kind === 'unoffered-type') {
          action = unofferedType(state, seat, legal, owe, unit);
        } else if (kind === 'capped-raise') {
          action = { seat, type: 'raise', amount: state.currentBet + unit };
        } else {
          action = { seat, type: 'fold' };
        }
        expectRejected(state, action, code);
        counts[kind]++;
        injected++;

        const result = applyAction(state, legal[rng.nextInt(legal.length)] as Action);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        state = result.state;
      }
      if (state.result !== null) {
        const dealt = state.players[rng.nextInt(state.players.length)]?.seat as SeatNumber;
        expectRejected(state, { seat: dealt, type: 'check' }, 'hand-complete');
        counts['hand-complete']++;
      }
    }

    expect(injected).toBe(TARGET);
    expect(
      counts['out-of-turn'] +
        counts['wrong-amount'] +
        counts['unoffered-type'] +
        counts['capped-raise'] +
        counts['fold-unfaced'],
    ).toBe(TARGET);
    expect(counts['out-of-turn']).toBeGreaterThanOrEqual(20_000);
    expect(counts['wrong-amount']).toBeGreaterThanOrEqual(20_000);
    expect(counts['unoffered-type']).toBeGreaterThanOrEqual(20_000);
    expect(counts['capped-raise']).toBeGreaterThanOrEqual(1_000);
    expect(counts['fold-unfaced']).toBeGreaterThanOrEqual(1_000);
    expect(counts['hand-complete']).toBeGreaterThanOrEqual(1_000);
  });
});
