import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { recommendPostflop, toPct, VALUE_THRESHOLD_PCT } from '../../src/advice/postflop';
import { recommendPreflop } from '../../src/advice/preflop';
import { callingRange, estimateOpponentRanges, unseenCombos } from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, recommend } from '../../src/advice/recommend';
import { parseCards, type Card } from '../../src/engine/cards';
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

function stateAfter(
  steps: Step[],
  deck: readonly Card[] = ORDERED_DECK,
  stacks: Partial<Record<SeatNumber, number>> = {},
) {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: ([1, 2, 3, 4, 5, 6] as const).map((seat) => ({ seat, stack: stacks[seat] ?? 160 })),
    button: 1,
    deck,
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

const result = (input: EquityInput, equity: number): EquityResult => ({
  hero: { win: equity, tie: 0, equity },
  opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
  method: 'exact',
  trials: 1,
});

/** `whole` for the first (whole-range) run, `calling` for every later run; records every input. */
function twoRuns(whole: number, calling: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return result(input, calls.length === 1 ? whole : calling);
  };
  return { fn, calls };
}

const adviseWithRuns = (view: PlayerView, whole: number, calling: number) =>
  recommendPostflop(view, { equity: twoRuns(whole, calling).fn });

describe('rule check-free', () => {
  it('checks when nothing is owed and the calling-range equity is not above 50%, whatever the equity', () => {
    const view = viewAfter(FLOP_CHECK);
    for (const equity of [0, 0.5, 1]) {
      const result = adviseWithRuns(view, equity, 0.5);
      expect(result).toMatchObject({
        action: 'check',
        ruleId: 'check-free',
        requiredEquityPct: 0,
        callAmount: 0,
        pot: 16,
        equityPct: toPct(equity),
        equityVsCallingRangePct: 50,
      });
      expect(result.move).toStrictEqual({ seat: 3, type: 'check' });
    }
  });
});

describe('rule pot-odds-call', () => {
  it('calls when the rounded equity reaches the rounded required equity', () => {
    const flop = viewAfter(FLOP_BET);
    for (const equity of [0.1667, 0.5, 1]) {
      const result = adviseWithRuns(flop, equity, 0.5);
      expect(result).toMatchObject({
        action: 'call',
        ruleId: 'pot-odds-call',
        requiredEquityPct: 16.7,
        callAmount: 4,
        pot: 20,
      });
      expect(result.move).toStrictEqual({ seat: 3, type: 'call', amount: 4 });
    }
    // 0.1665 is below the unrounded 1/6 but rounds to the same 16.7%, so it must call (Q-2).
    expect(adviseWith(flop, 0.1665)).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      equityPct: 16.7,
      requiredEquityPct: 16.7,
    });
    // TASK-7.32: the turn price counts one river big bet, (8 + 8) / (24 + 8 + 16) = 33.3%.
    const turn = adviseWith(viewAfter(TURN_BET), 0.3333);
    expect(turn).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      street: 'turn',
      equityPct: 33.3,
      requiredEquityPct: 33.3,
      requiredCountsRiverBet: true,
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
      [turn, 0.3324, 33.2],
      [turn, 0, 0],
    ];
    for (const [view, equity, equityPct] of cases) {
      const result = adviseWith(view, equity);
      expect(result).toMatchObject({ action: 'fold', ruleId: 'pot-odds-fold', equityPct });
      expect(result.move).toStrictEqual({ seat: 3, type: 'fold' });
    }
  });
});

/** Hero (seat 3) holds `hero`; `board` fills the flop (13-15) and turn (17) deal positions. */
function drawDeck(hero: string, board: string): Card[] {
  const positions = [1, 7, 13, 14, 15, 17];
  const placed = new Map(parseCards(`${hero} ${board}`).map((card, i) => [positions[i], card]));
  const rest = ORDERED_DECK.filter((card) => ![...placed.values()].includes(card));
  return ORDERED_DECK.map((_, i) => placed.get(i) ?? (rest.shift() as Card));
}

/** Ah5h on Kh 9h 2c: a flush draw with 9 outs. */
const drawView = (steps: Step[], stacks: Partial<Record<SeatNumber, number>> = {}) =>
  playerView(stateAfter(steps, drawDeck('Ah 5h', 'Kh 9h 2c'), stacks), 3);
const HEARTS_OUTS = parseCards('2h 3h 4h 6h 7h 8h Th Jh Qh');

describe('rule implied-odds-call', () => {
  it('calls a flop draw at the implied price with two cards to come', () => {
    // Pot 20, call 4, three opponents not all in: 4 / (24 + 3 x 8) = 8.3%.
    const view = drawView(FLOP_BET);
    for (const [equity, equityPct] of [
      [0.083, 8.3],
      [0.1, 10],
      [0.166, 16.6],
    ] as const) {
      const result = adviseWithRuns(view, equity, 0.4);
      expect(result).toMatchObject({
        action: 'call',
        ruleId: 'implied-odds-call',
        equityPct,
        requiredEquityPct: 16.7,
        impliedRequiredEquityPct: 8.3,
        outs: HEARTS_OUTS,
      });
      expect(result.move).toStrictEqual({ seat: 3, type: 'call', amount: 4 });
    }
    expect(adviseWith(view, 0.0824)).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      equityPct: 8.2,
      impliedRequiredEquityPct: 8.3,
    });
  });

  it('leaves calls at the pot-odds price and value raises to the earlier rules', () => {
    const view = drawView(FLOP_BET);
    expect(adviseWithRuns(view, 0.2, 0.4)).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      impliedRequiredEquityPct: 8.3,
      outs: HEARTS_OUTS,
    });
    expect(adviseWithRuns(view, 0.1, 0.651)).toMatchObject({
      action: 'raise',
      ruleId: 'value-raise',
      impliedRequiredEquityPct: 8.3,
    });
  });

  it('does not apply without a draw', () => {
    const result = adviseWith(viewAfter(FLOP_BET), 0.1);
    expect(result).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      impliedRequiredEquityPct: null,
      outs: [],
    });
  });

  it('does not apply when the call puts the hero all in', () => {
    // Hero starts with 8: the 4 big blind, then the 4 call is the last chips.
    const result = adviseWith(drawView(FLOP_BET, { 3: 8 }), 0.1);
    expect(result).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      callAmount: 4,
      impliedRequiredEquityPct: null,
      outs: HEARTS_OUTS,
    });
  });

  it('counts only opponents who are not all in', () => {
    // Seat 2 starts with 8 and is all in after its 4 flop bet heads-up: nobody left to pay.
    const huBet: Step[] = [f(4), f(5), f(6), f(1), c(2, 2), k(3), b(2, 4)];
    const alone = adviseWith(drawView(huBet, { 2: 8 }), 0.1);
    expect(alone).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      impliedRequiredEquityPct: null,
      outs: HEARTS_OUTS,
    });
    // Seat 6 is all in after calling 4 preflop: two payers, 4 / (24 + 2 x 8) = 10.0%.
    const oneAllIn = adviseWith(drawView(FLOP_BET, { 6: 4 }), 0.1);
    expect(oneAllIn).toMatchObject({
      action: 'call',
      ruleId: 'implied-odds-call',
      opponents: 3,
      impliedRequiredEquityPct: 10,
    });
  });

  it('lists the outs but has no implied price when nothing is owed', () => {
    const result = adviseWithRuns(drawView(FLOP_CHECK), 0.3, 0.4);
    expect(result).toMatchObject({
      action: 'check',
      ruleId: 'check-free',
      impliedRequiredEquityPct: null,
      outs: HEARTS_OUTS,
    });
  });
});

describe('rule value-bet', () => {
  it('bets when nothing is owed and the rounded calling-range equity is above 50.0%', () => {
    const view = viewAfter(FLOP_CHECK);
    expect(VALUE_THRESHOLD_PCT).toBe(50);
    for (const [calling, pct] of [
      [0.501, 50.1],
      [0.50051, 50.1],
      [1, 100],
    ] as const) {
      const advice = adviseWithRuns(view, 0.2, calling);
      expect(advice).toMatchObject({
        action: 'bet',
        ruleId: 'value-bet',
        equityPct: 20,
        equityVsCallingRangePct: pct,
        requiredEquityPct: 0,
      });
      expect(advice.move).toStrictEqual({ seat: 3, type: 'bet', amount: 4 });
    }
    for (const [calling, pct] of [
      [0.5, 50],
      [0.50049, 50],
      [0.3, 30],
    ] as const) {
      expect(adviseWithRuns(view, 0.9, calling)).toMatchObject({
        action: 'check',
        ruleId: 'check-free',
        equityVsCallingRangePct: pct,
      });
    }
  });

  it('plays the legal raise when nothing is owed but only a raise is offered (A-4)', () => {
    const free = viewAfter(FLOP_CHECK);
    const raise = { seat: 3, type: 'raise', amount: 6 } as const;
    const shortAllIn = {
      ...free,
      legalActions: free.legalActions.map((a) => (a.type === 'bet' ? raise : a)),
    };
    expect(adviseWithRuns(shortAllIn, 0.2, 0.6)).toMatchObject({
      action: 'raise',
      ruleId: 'value-bet',
      move: raise,
    });
    const noAggression = {
      ...free,
      legalActions: free.legalActions.filter((a) => a.type !== 'bet'),
    };
    expect(adviseWithRuns(noAggression, 0.2, 0.9)).toMatchObject({
      action: 'check',
      ruleId: 'check-free',
      equityVsCallingRangePct: 90,
    });
  });

  it('runs one multiway equity against every live opponent’s calling range (A-1)', () => {
    const view = viewAfter(RIVER_BET);
    const spy = twoRuns(0.2, 0.7);
    const advice = recommendPostflop(view, { equity: spy.fn });
    expect(advice).toMatchObject({ opponents: 2, equityVsCallingRangePct: 70 });
    expect(spy.calls).toHaveLength(2);
    const unseen = unseenCombos([...view.holeCards, ...view.board]);
    const calling = callingRange(unseen, view.board);
    expect(calling.length).toBeLessThan(unseen.length);
    expect(spy.calls[1]).toEqual({
      hero: view.holeCards,
      board: view.board,
      opponents: [calling, calling],
    });

    const real = recommendPostflop(viewAfter(HU_RIVER_BET));
    const huView = viewAfter(HU_RIVER_BET);
    const huUnseen = unseenCombos([...huView.holeCards, ...huView.board]);
    const expected = computeEquity({
      hero: huView.holeCards,
      board: huView.board,
      opponents: [callingRange(huUnseen, huView.board)],
    });
    expect(real.equityVsCallingRangePct).toBe(toPct(expected.hero.equity));
  });

  it('falls back through the range chain, then to the whole-range equity (A-5, A-7)', () => {
    const view = viewAfter(FLOP_CHECK);
    const estimated = estimateOpponentRanges(view);
    const calls: EquityInput[] = [];
    // Whole-range run succeeds; the first calling-range attempt throws, the second succeeds.
    const once = (input: EquityInput): EquityResult => {
      calls.push(input);
      if (calls.length === 2) throw new RangeError('no deal');
      return result(input, calls.length === 1 ? 0.2 : 0.8);
    };
    expect(recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: once })).toMatchObject({
      action: 'bet',
      ruleId: 'value-bet',
      equityVsCallingRangePct: 80,
    });
    expect(calls.map((c) => c.opponents)).toEqual([
      estimated.map((o) => o.combos),
      estimated.map((o) => callingRange(o.combos, view.board)),
      estimated.map((o) => callingRange(o.start, view.board)),
    ]);

    let runs = 0;
    const callingAlwaysThrows = (input: EquityInput): EquityResult => {
      if (++runs > 1) throw new RangeError('Sampling rejected too many deals');
      return result(input, 0.6);
    };
    expect(
      recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: callingAlwaysThrows }),
    ).toMatchObject({ equityPct: 60, equityVsCallingRangePct: 60, ruleId: 'value-bet' });
    expect(runs).toBe(4);

    const broken = (input: EquityInput): EquityResult => {
      if (++runs > 5) throw new TypeError('broken');
      return result(input, 0.6);
    };
    expect(() => recommendPostflop(view, { equity: broken })).toThrow('broken');
  });
});

describe('rule value-raise', () => {
  it('raises facing a bet when the rounded calling-range equity is above 65.0% and a raise is legal', () => {
    const flop = viewAfter(FLOP_BET);
    const advice = adviseWithRuns(flop, 0.1, 0.651);
    expect(advice).toMatchObject({
      action: 'raise',
      ruleId: 'value-raise',
      equityPct: 10,
      equityVsCallingRangePct: 65.1,
      requiredEquityPct: 16.7,
      callAmount: 4,
      valueThresholdPct: 65,
    });
    expect(advice.move).toStrictEqual({ seat: 3, type: 'raise', amount: 8 });
    expect(adviseWithRuns(flop, 0.3, 0.65)).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
    });
    expect(adviseWithRuns(flop, 0.1, 0.65)).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
    });
  });

  it('falls back to pot odds when no raise is legal', () => {
    const flop = viewAfter(FLOP_BET);
    const capped = { ...flop, legalActions: flop.legalActions.filter((a) => a.type !== 'raise') };
    expect(adviseWithRuns(capped, 0.9, 0.9)).toMatchObject({
      action: 'call',
      ruleId: 'pot-odds-call',
      equityVsCallingRangePct: 90,
    });
    expect(adviseWithRuns(capped, 0.01, 0.9)).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
    });
  });
});

describe('explanations (TASK-7.32)', () => {
  it('explanations name the river bet and the 65 percent raise threshold', () => {
    // SPEC-03 spot: pot 28 after the flop, seat 2 bets 8 on the turn, hero (seat 3) keeps 100 behind.
    const turnSteps: Step[] = [...PREFLOP, b(2, 4), c(3, 4), f(6), c(1, 4), b(2, 8)];
    const turn = playerView(stateAfter(turnSteps, ORDERED_DECK, { 3: 108 }), 3);
    const fold = adviseWith(turn, 0.22);
    expect(fold).toMatchObject({
      ruleId: 'pot-odds-fold',
      pot: 36,
      requiredEquityPct: 26.7,
      requiredCountsRiverBet: true,
      outs: [],
    });
    expect(fold.explanation).toContain('22.0%');
    expect(fold.explanation).toContain(
      'Pot odds, the cost of a call as a share of the pot after you call, counting the big bet you will likely face on the river, ask for 26.7%, more than you have, so folding saves chips over time.',
    );
    expect(fold.explanation.split(/(?<=[.!?])\s+(?=[A-Z])/).length).toBeLessThanOrEqual(3);

    const raise = adviseWithRuns(turn, 0.7, 0.7);
    expect(raise).toMatchObject({ ruleId: 'value-raise', valueThresholdPct: 65 });
    expect(raise.explanation).toContain('is above 65.0%, so raising is a value bet');
    expect(raise.explanation).not.toContain('50.0%');

    const flop = adviseWith(viewAfter(FLOP_BET), 0.1);
    expect(flop).toMatchObject({ ruleId: 'pot-odds-fold', requiredCountsRiverBet: false });
    expect(flop.explanation).not.toContain('river');
    const river = adviseWith(viewAfter(RIVER_BET), 0.1);
    expect(river).toMatchObject({ ruleId: 'pot-odds-fold', requiredCountsRiverBet: false });
    expect(river.explanation).not.toContain('river');
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
