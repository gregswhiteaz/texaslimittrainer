import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommendPreflop } from '../../src/advice/preflop';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  STREET_BET_CAP,
  type Action,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../../src/engine/hand';
import { INVARIANTS } from '../../src/engine/invariants';
import { playerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import { FAULTS } from '../support/faulty-engine';

const STAKES_4_8: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);

function newHand(size: number, button: SeatNumber, deck: Card[] = DECK): HandState {
  return createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button,
    deck,
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

/** Asserts the seat to act may only fold or call `call`, and that raising one unit higher is rejected. */
function expectCapped(state: HandState, seat: SeatNumber, call: number, raiseTo: number): void {
  expect(state.betCount).toBe(STREET_BET_CAP);
  expect(state.toAct).toBe(seat);
  expect(legalActions(state)).toEqual([
    { seat, type: 'fold' },
    { seat, type: 'call', amount: call },
  ]);
  const result = applyAction(state, { seat, type: 'raise', amount: raiseTo });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe('illegal-action');
}

/** 6 seats, button 1: seats 4, 5, 6 raise to 8, 12, 16 (big blind + 3 raises). */
const PREFLOP_RAISES: Step[] = [
  [4, 'raise', 8],
  [5, 'raise', 12],
  [6, 'raise', 16],
];
const preflopCapped = (deck: Card[] = DECK) => play(newHand(6, 1, deck), ...PREFLOP_RAISES);

/** 3 seats, button 1: limp preflop, then a capped flop (4/8/12/16) everyone calls. */
const FLOP_CAPPED: Step[] = [
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
  [2, 'bet', 4],
  [3, 'raise', 8],
  [1, 'raise', 12],
  [2, 'raise', 16],
];
const TURN_CAPPED: Step[] = [
  [3, 'call', 8],
  [1, 'call', 4],
  [2, 'bet', 8],
  [3, 'raise', 16],
  [1, 'raise', 24],
  [2, 'raise', 32],
];
const RIVER_CAPPED: Step[] = [
  [3, 'call', 16],
  [1, 'call', 8],
  [2, 'bet', 8],
  [3, 'raise', 16],
  [1, 'raise', 24],
  [2, 'raise', 32],
];

function postflopCapped(): HandState[] {
  const flop = play(newHand(3, 1), ...FLOP_CAPPED);
  const turn = play(flop, ...TURN_CAPPED);
  const river = play(turn, ...RIVER_CAPPED);
  return [flop, turn, river];
}

/** Counted bets per betting street (REQ-016.5): the big blind, then each bet or raise that adds at least half a
 *  unit over the street's last counted level. A short all-in under half a bet does not count. */
function betsPerStreet(state: HandState): number[] {
  const streets = ['preflop', 'flop', 'turn', 'river'];
  const counts = [0, 0, 0, 0];
  const levels = [0, 0, 0, 0];
  for (const a of state.actions) {
    const i = streets.indexOf(a.street);
    const unit = i < 2 ? state.stakes.smallBet : state.stakes.bigBet;
    const counted =
      a.type === 'big-blind' ||
      ((a.type === 'bet' || a.type === 'raise') && 2 * (a.amount - (levels[i] as number)) >= unit);
    if (counted) {
      counts[i] = (counts[i] as number) + 1;
      levels[i] = a.amount;
    }
  }
  return counts;
}

describe('bet cap acceptance', () => {
  it('AC#1 preflop allows the big blind plus three raises, then only call or fold', () => {
    const control = play(newHand(6, 1), [4, 'raise', 8], [5, 'raise', 12]);
    expect(control.betCount).toBe(3);
    expect(legalActions(control)).toContainEqual({ seat: 6, type: 'raise', amount: 16 });

    const capped = preflopCapped();
    expectCapped(capped, 1, 16, 20);
    const afterButton = play(capped, [1, 'fold']);
    expectCapped(afterButton, 2, 14, 20);
    expectCapped(play(afterButton, [2, 'call', 14]), 3, 12, 20);
  });

  it('AC#2 flop, turn and river allow a bet plus three raises, then only call or fold', () => {
    const [flop, turn, river] = postflopCapped() as [HandState, HandState, HandState];
    expect([flop.street, turn.street, river.street]).toEqual(['flop', 'turn', 'river']);
    expectCapped(flop, 3, 8, 20);
    expectCapped(turn, 3, 16, 40);
    expectCapped(river, 3, 16, 40);
  });

  it('AC#3 heads-up caps preflop at the big blind plus three raises and the flop at four bets', () => {
    const start = newHand(2, 1);
    expect(start.actions.map((a) => [a.seat, a.type, a.amount])).toEqual([
      [1, 'small-blind', 2],
      [2, 'big-blind', 4],
    ]);
    const preflop = play(start, [1, 'raise', 8], [2, 'raise', 12], [1, 'raise', 16]);
    expectCapped(preflop, 2, 4, 20);

    const flop = play(start, [1, 'call', 2], [2, 'check']);
    expect(flop.street).toBe('flop');
    const first = flop.toAct as SeatNumber;
    const second = first === 1 ? 2 : 1;
    const capped = play(
      flop,
      [first, 'bet', 4],
      [second, 'raise', 8],
      [first, 'raise', 12],
      [second, 'raise', 16],
    );
    expectCapped(capped, first, 4, 20);
  });

  it('AC#4 100,000 random seeded hands with 2 to 10 players never put more than 4 bets on a street', () => {
    let hands = 0;
    let reachedCap = 0;
    let overCap = 0;
    for (let size = 2; size <= 10; size++) {
      const summary = runPlaytest(
        { hands: size === 2 ? 11_112 : 11_111, seed: 1200 + size, size },
        (hand: PlayedHand) => {
          for (const count of betsPerStreet(hand.final)) {
            if (count > STREET_BET_CAP) overCap++;
            if (count === STREET_BET_CAP) reachedCap++;
          }
        },
        { makePolicy: (code, seat) => randomMovePolicy(seatGenerator(code, seat)) },
      );
      expect(summary.violations, `size ${size}`).toBe(0);
      hands += summary.handsPlayed;
    }
    expect(hands).toBe(100_000);
    expect(overCap).toBe(0);
    expect(reachedCap).toBeGreaterThan(0);
  }, 60_000);

  it('AC#5 legalActions and recommendPreflop both withhold the raise at 4 bets', () => {
    // Button 1 deals seat 1 deck[5] and deck[11].
    const aces = parseCards('As Ah');
    const deck = [...aces, ...DECK.filter((card) => !aces.includes(card))];
    [deck[0], deck[5]] = [deck[5] as Card, deck[0] as Card];
    [deck[1], deck[11]] = [deck[11] as Card, deck[1] as Card];

    const capped = preflopCapped(deck);
    const view = playerView(capped, 1);
    expect(view.holeCards).toEqual(aces);
    expect(view.betCount).toBe(STREET_BET_CAP);
    expect(view.legalActions.some((a) => a.type === 'raise')).toBe(false);
    const advice = recommendPreflop(view);
    expect(advice.cell.action).toBe('raise');
    expect(advice.action).toBe('call');
    expect(advice.alternative).not.toBe('raise');

    const uncapped = play(newHand(6, 1, deck), [4, 'raise', 8], [5, 'fold'], [6, 'raise', 12]);
    const open = playerView(uncapped, 1);
    expect(open.betCount).toBe(STREET_BET_CAP - 1);
    expect(recommendPreflop(open).action).toBe('raise');

    const source = readFileSync(new URL('../../src/advice/preflop.ts', import.meta.url), 'utf8');
    expect(source).toContain('view.betCount < STREET_BET_CAP');
  });

  it('AC#6 a fifth raise is not legal', () => {
    expect(STREET_BET_CAP).toBe(4);
    const spots: [HandState, number][] = [
      [preflopCapped(), 20],
      ...postflopCapped().map((s, i): [HandState, number] => [s, i === 0 ? 20 : 40]),
    ];
    for (const [state, raiseTo] of spots) {
      expect(state.betCount).toBe(4);
      const types = legalActions(state).map((a) => a.type);
      expect(types).not.toContain('raise');
      expect(types).not.toContain('bet');
      const seat = state.toAct as SeatNumber;
      const result = applyAction(state, { seat, type: 'raise', amount: raiseTo });
      expect(result).toEqual({
        ok: false,
        error: { code: 'illegal-action', message: `Illegal action for seat ${seat}` },
      });
    }
  });

  it('AC#6 the invariant checker still catches a fifth bet the engine was tricked into accepting', () => {
    const summary = runPlaytest({ hands: 20, seed: 42, size: 6 }, undefined, FAULTS.fifthBet.seams);
    expect(summary.violationCounts['bet-cap']).toBeGreaterThanOrEqual(1);
    for (const id of INVARIANTS.filter((id) => id !== 'bet-cap')) {
      expect(summary.violationCounts[id], id).toBe(0);
    }
    expect(summary.firstViolation?.violation?.violations[0]?.message).toMatch(
      /^(preflop|flop|turn|river) has 5 bets \(at most 4\)$/,
    );
    const checker = readFileSync(
      new URL('../../src/engine/invariants.ts', import.meta.url),
      'utf8',
    );
    expect(checker).not.toContain('STREET_BET_CAP');
  });
});

it('DRILL TASK-1.50: deliberately broken (tests/engine/bet-cap.acceptance.test.ts)', () => {
  expect('drill').toBe('green');
});
