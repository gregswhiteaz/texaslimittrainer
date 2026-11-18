import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommendPostflop, toPct } from '../../src/advice/postflop';
import { recommendPreflop } from '../../src/advice/preflop';
import { recommend } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ORDERED_DECK = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];

/** Button 1, seats 1-6: 4 and 5 fold, 6, 1 and 2 call, 3 checks: pot 16, live 1, 2, 3, 6. */
const PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const FLOP_BET: Step[] = [...PREFLOP, b(2, 4)];
const FLOP_CHECK: Step[] = [...PREFLOP, k(2)];
const TURN_BET: Step[] = [...PREFLOP, k(2), k(3), k(6), k(1), b(2, 8)];
/** Seat 6 folds to the flop bet; everyone checks the turn; seat 2 bets the river. */
const RIVER_BET: Step[] = [...PREFLOP, b(2, 4), c(3, 4), f(6), c(1, 4), k(2), k(3), k(1), b(2, 8)];
/** Heads-up: everyone but the blinds folds, then checks to a river bet by seat 2. */
const HU_RIVER_BET: Step[] = [
  f(4),
  f(5),
  f(6),
  f(1),
  c(2, 2),
  k(3),
  k(2),
  k(3),
  k(2),
  k(3),
  b(2, 8),
];

function stateAfter(steps: Step[]) {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: ORDERED_DECK,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return state;
}

const viewAfter = (steps: Step[], seat: SeatNumber = 3): PlayerView =>
  playerView(stateAfter(steps), seat);

function fixedEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'exact',
      trials: 1,
    };
  };
  return { fn, calls };
}

const adviseWith = (view: PlayerView, equity: number) =>
  recommendPostflop(view, { equity: fixedEquity(equity).fn });

describe('rule check-free', () => {
  it('checks whenever nothing is owed, whatever the equity', () => {
    const view = viewAfter(FLOP_CHECK);
    for (const equity of [0, 0.5, 1]) {
      const result = adviseWith(view, equity);
      expect(result).toMatchObject({
        action: 'check',
        ruleId: 'check-free',
        requiredEquityPct: 0,
        callAmount: 0,
        pot: 16,
        equityPct: toPct(equity),
      });
      expect(result.move).toStrictEqual({ seat: 3, type: 'check' });
    }
  });
});

describe('rule pot-odds-call', () => {
  it('calls when the rounded equity reaches the rounded required equity', () => {
    const flop = viewAfter(FLOP_BET);
    for (const equity of [0.1667, 0.5, 1]) {
      const result = adviseWith(flop, equity);
      expect(result).toMatchObject({
        action: 'call',
        ruleId: 'pot-odds-call',
        requiredEquityPct: 16.7,
        callAmount: 4,
        pot: 20,
      });
      expect(result.move).toStrictEqual({ seat: 3, type: 'call', amount: 4 });
    }
    const turn = adviseWith(viewAfter(TURN_BET), 0.25);
    expect(turn).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      street: 'turn',
      equityPct: 25,
      requiredEquityPct: 25,
      callAmount: 8,
      pot: 24,
    });
  });
});

describe('rule pot-odds-fold', () => {
  it('folds when the rounded equity is below the rounded required equity', () => {
    const flop = viewAfter(FLOP_BET);
    const turn = viewAfter(TURN_BET);
    const cases: [PlayerView, number, number][] = [
      [flop, 0.1656, 16.6],
      [flop, 0, 0],
      [turn, 0.2449, 24.5],
      [turn, 0, 0],
    ];
    for (const [view, equity, equityPct] of cases) {
      const result = adviseWith(view, equity);
      expect(result).toMatchObject({ action: 'fold', ruleId: 'pot-odds-fold', equityPct });
      expect(result.move).toStrictEqual({ seat: 3, type: 'fold' });
    }
  });
});

describe('toPct', () => {
  it('rounds half up to one decimal', () => {
    const cases: [number, number][] = [
      [4 / 24, 16.7],
      [0.1665, 16.7],
      [0.16649, 16.6],
      [0, 0],
      [1, 100],
      [0.5, 50],
    ];
    for (const [fraction, pct] of cases) expect(toPct(fraction), String(fraction)).toBe(pct);
  });
});

describe('postflop advice inputs', () => {
  it('builds opponent ranges, pot and call amount from the view', () => {
    const spots: [Step[], number, number][] = [
      [FLOP_BET, 3, 1081],
      [TURN_BET, 3, 1035],
      [RIVER_BET, 2, 990],
    ];
    for (const [steps, opponents, combos] of spots) {
      const view = viewAfter(steps);
      const spy = fixedEquity(0.5);
      const result = recommendPostflop(view, { equity: spy.fn });
      expect(result.opponents).toBe(opponents);
      const input = spy.calls[0] as EquityInput;
      expect(input.hero).toEqual(view.holeCards);
      expect(input.board).toEqual(view.board);
      expect(input.opponents).toHaveLength(opponents);
      const dead = [...view.holeCards, ...view.board];
      const expected: [number, number][] = [];
      for (let a = 0; a < 52; a++) {
        for (let d = a + 1; d < 52; d++) {
          if (!dead.includes(a) && !dead.includes(d)) expected.push([a, d]);
        }
      }
      expect(expected).toHaveLength(combos);
      for (const range of input.opponents) expect(range).toEqual(expected);

      const pot =
        view.pots.reduce((sum, p) => sum + p.amount, 0) +
        view.players.reduce((sum, p) => sum + p.streetContribution, 0);
      expect(result.pot).toBe(pot);
      const call = view.legalActions.find((a) => a.type === 'call');
      expect(result.callAmount).toBe(call?.type === 'call' ? call.amount : -1);
    }

    const river = recommendPostflop(viewAfter(RIVER_BET), { equity: fixedEquity(0.5).fn });
    expect(river).toMatchObject({ street: 'river', pot: 36, callAmount: 8, opponents: 2 });

    const hu = viewAfter(HU_RIVER_BET);
    const first = recommendPostflop(hu);
    expect(first).toMatchObject({ street: 'river', opponents: 1, equityMethod: 'exact' });
    expect(recommendPostflop(hu)).toStrictEqual(first);
  });
});

describe('postflop advice API', () => {
  it('rejects bad views and dispatches by street', () => {
    const preflop = viewAfter([]);
    expect(() => recommendPostflop(preflop)).toThrow(
      new RangeError('Postflop advice needs a flop, turn or river view, got preflop'),
    );
    const allChecked = stateAfter([
      ...PREFLOP,
      ...[2, 3, 6, 1].map(k),
      ...[2, 3, 6, 1].map(k),
      ...[2, 3, 6, 1].map(k),
    ]);
    expect(allChecked.street).toBe('showdown');
    expect(() => recommendPostflop(playerView(allChecked, 3))).toThrow(
      new RangeError('Postflop advice needs a flop, turn or river view, got showdown'),
    );
    expect(() => recommendPostflop(viewAfter(FLOP_BET, 6))).toThrow(
      new RangeError('Seat 6 is not to act'),
    );

    const facing = viewAfter(FLOP_BET);
    const noCall = {
      ...facing,
      legalActions: facing.legalActions.filter((a) => a.type !== 'call'),
    };
    expect(() => adviseWith(noCall, 0.5)).toThrow(new Error('No legal call for seat 3'));
    const free = viewAfter(FLOP_CHECK);
    const noCheck = { ...free, legalActions: free.legalActions.filter((a) => a.type !== 'check') };
    expect(() => adviseWith(noCheck, 0.5)).toThrow(new Error('No legal check for seat 3'));

    const preflopHero = viewAfter([], 4);
    const chart = recommend(preflopHero);
    expect(chart.basis).toBe('chart');
    expect(chart).toStrictEqual(recommendPreflop(preflopHero));
    const flop = recommend(facing);
    expect(flop.basis).toBe('equity');
    expect(flop).toStrictEqual(recommendPostflop(facing));
  });
});
