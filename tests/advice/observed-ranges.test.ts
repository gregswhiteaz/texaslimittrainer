import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { comboCount, HAND_CLASSES } from '../../src/advice/hand-class';
import { recommendPostflop, toPct } from '../../src/advice/postflop';
import {
  DEFAULT_RANGES,
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  HAND_ORDER,
  parseHandOrder,
  rangeWidthPct,
  RangeValidationError,
  scaledWidthPct,
  SIX_MAX_RANGES,
  strongestClasses,
  unseenCombos,
  type ObservedOpponent,
} from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, adviceOptions, recommend } from '../../src/advice/recommend';
import { type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import handOrderRaw from '../../src/advice/ranges/hand-order.json' with { type: 'json' };

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);
type Step = [SeatNumber, Action['type'], number?];

/** Button 1 (SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1); plays `steps`. */
function stateAfter(steps: Step[]): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: 6 }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: ALL_CARDS,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const toActView = (steps: Step[]): PlayerView => {
  const state = stateAfter(steps);
  return playerView(state, state.toAct as SeatNumber);
};

/** Flop, hero BB (3) to act against UTG (4, open-raise) and CO (6, call-raise); HJ (5) folded. */
const MULTIWAY: Step[] = [
  [4, 'raise', 8],
  [5, 'fold'],
  [6, 'call', 8],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'call', 4],
];
/** Flop, hero SB (2) to act against BB (3, check) and UTG (4, limp). */
const LIMPED: Step[] = [
  [4, 'call', 4],
  [5, 'fold'],
  [6, 'fold'],
  [1, 'fold'],
  [2, 'call', 2],
  [3, 'check'],
];

/** UTG (4) opens, HJ (5) three-bets, UTG calls: flop, UTG to act against the three-bettor. */
const THREE_BET: Step[] = [
  [4, 'raise', 8],
  [5, 'raise', 12],
  [6, 'fold'],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'fold'],
  [4, 'call', 4],
];
/** UTG (4) opens, HJ (5) three-bets, UTG four-bets, HJ calls: flop, UTG to act. */
const FOUR_BET: Step[] = [
  [4, 'raise', 8],
  [5, 'raise', 12],
  [6, 'fold'],
  [1, 'fold'],
  [2, 'fold'],
  [3, 'fold'],
  [4, 'raise', 16],
  [5, 'call', 4],
];

/** Combos of `classes` as a percent of 1326, counted here rather than with rangeWidthPct. */
const widthOf = (classes: Iterable<string>) => {
  let combos = 0;
  for (const hc of classes) combos += comboCount(hc);
  return (combos / 1326) * 100;
};

/** Reports 50% for the hero; records every input. */
function recordingEquity() {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: 0.5, tie: 0, equity: 0.5 },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'exact',
      trials: 0,
    };
  };
  return { fn, calls };
}

const entry = (fields: Partial<ObservedOpponent>): ObservedOpponent => ({
  seat: 4,
  hands: 50,
  vpip: 30,
  pfr: 20,
  ...fields,
});

const problemsOf = (raw: unknown): readonly string[] => {
  try {
    parseHandOrder(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(RangeValidationError);
    return (error as RangeValidationError).problems;
  }
  throw new Error('expected a RangeValidationError');
};

describe('hand order', () => {
  const stored = new Map(handOrderRaw.hands.map(([hc, pct]) => [hc as string, pct as number]));

  it('is every class once, strongest first, with non-increasing equities and grid-order ties', () => {
    expect(HAND_ORDER).toHaveLength(169);
    expect(new Set(HAND_ORDER)).toEqual(new Set(HAND_CLASSES));
    expect(HAND_ORDER[0]).toBe('AA');
    HAND_ORDER.slice(1).forEach((hc, i) => {
      const prev = HAND_ORDER[i] as string;
      const [a, b] = [stored.get(prev) as number, stored.get(hc) as number];
      expect(b).toBeLessThanOrEqual(a);
      if (a === b) expect(HAND_CLASSES.indexOf(hc)).toBeGreaterThan(HAND_CLASSES.indexOf(prev));
    });
    expect(handOrderRaw.justification.match(/\p{L}+/gu)?.length).toBeGreaterThanOrEqual(50);
  });

  it('stores the equity the calculator gives each class against one random hand', () => {
    for (const hc of ['AA', 'KK', 'AKs', 'AKo', 'T9s', '72o', '32o']) {
      const combo = expandRange(new Set([hc]), [])[0] as readonly [Card, Card];
      const result = computeEquity({ hero: combo, board: [], opponents: [unseenCombos(combo)] });
      expect(toPct(result.hero.equity), hc).toBe(stored.get(hc));
    }
  });

  it('rejects broken hand-order data, listing every problem', () => {
    const hands = handOrderRaw.hands;
    const valid = { ...handOrderRaw };
    expect(parseHandOrder(valid)).toEqual(HAND_ORDER);
    expect(problemsOf({ ...valid, format: 'other' })).toEqual([
      'Hand order: expected format "tlh-hand-order" version 1',
    ]);
    expect(problemsOf({ ...valid, justification: 'too short' })).toEqual([
      'Hand order: missing plain-English justification (at least 50 words)',
    ]);
    const duplicate = problemsOf({ ...valid, hands: [...hands.slice(0, 168), hands[167]] });
    expect(duplicate).toContain(`Hand order: duplicate class ${String(hands[167]?.[0])}`);
    expect(duplicate).toContain(`Hand order: missing class ${String(hands[168]?.[0])}`);
    expect(problemsOf({ ...valid, hands: hands.slice(0, 168) })).toEqual([
      `Hand order: missing class ${String(hands[168]?.[0])}`,
    ]);
    const swapped = [hands[0], hands[2], hands[1], ...hands.slice(3)];
    expect(problemsOf({ ...valid, hands: swapped })).toEqual([
      `Hand order: ${String(hands[1]?.[0])} is out of order after ${String(hands[2]?.[0])}`,
    ]);
    const kkFirst = [hands[1], hands[0], ...hands.slice(2)];
    expect(problemsOf({ ...valid, hands: kkFirst })).toEqual([
      'Hand order: AA is out of order after KK',
      'Hand order: the first class must be AA',
    ]);
    expect(problemsOf({ ...valid, hands: [['ZZ', 1], 'AA', ...hands.slice(1)] })).toEqual([
      'Hand order: unknown class "ZZ"',
      'Hand order: entry 1 is not [class, equity]',
      'Hand order: missing class AA',
      'Hand order: the first class must be AA',
    ]);
  });

  it('takes the shortest prefix reaching the width, never less than AA', () => {
    expect(strongestClasses(0)).toEqual(new Set(['AA']));
    expect(strongestClasses(0.5)).toEqual(new Set(HAND_ORDER.slice(0, 2)));
    expect(strongestClasses(100).size).toBe(169);
    const prefix = [...strongestClasses(12.5)];
    const combos = (classes: readonly string[]) =>
      classes.reduce((sum, hc) => sum + comboCount(hc), 0);
    expect(prefix).toEqual(HAND_ORDER.slice(0, prefix.length));
    expect(combos(prefix)).toBeGreaterThanOrEqual(165.75);
    expect(combos(prefix.slice(0, -1))).toBeLessThan(165.75);
  });
});

describe('range width and scaling', () => {
  it('counts combos of the classes as a percent of 1326', () => {
    expect(rangeWidthPct(new Set(['AA', 'AKs', 'AKo']))).toBeCloseTo(
      ((6 + 4 + 12) / 1326) * 100,
      9,
    );
    expect(rangeWidthPct(new Set())).toBe(0);
    expect(rangeWidthPct(new Set(HAND_CLASSES))).toBeCloseTo(100, 9);
  });

  it('caps the observed hands at 100', () => {
    expect(scaledWidthPct(20, 60, 250)).toBeCloseTo(60, 9);
    expect(scaledWidthPct(20, 0, 150)).toBeCloseTo(0, 9);
    const view = toActView(MULTIWAY);
    const at = (hands: number) =>
      estimateOpponentRanges(view, [entry({ hands, vpip: 45, pfr: 35 })]).find((r) => r.seat === 4);
    expect(at(150)?.widthPct).toBeCloseTo(35, 9);
    expect(at(150)?.start).toEqual(at(100)?.start);
    expect(at(150)?.basis.text).toBe('based on 150 hands of this opponent');
  });

  it('scaledWidthPct is exactly the observed stat from 100 hands', () => {
    const ranges = Object.values(DEFAULT_RANGES).flatMap((r) => r.ranges);
    expect(ranges.length).toBeGreaterThan(0);
    for (const range of ranges) {
      const d = rangeWidthPct(range.classes);
      for (const o of [0, 37.5, 100]) {
        for (const n of [100, 150]) expect(scaledWidthPct(d, o, n)).toBe(o);
        for (const n of [30, 50, 99]) expect(scaledWidthPct(d, o, n)).toBe(d + ((o - d) * n) / 100);
      }
    }
    const view = toActView(MULTIWAY);
    const range = estimateOpponentRanges(view, [entry({ hands: 150, vpip: 0, pfr: 0 })]).find(
      (r) => r.seat === 4,
    );
    expect(range?.widthPct).toBe(0);
  });

  it('scales each line by its stat: PFR for raises, VPIP for calls', () => {
    const afterCheck = (steps: Step[]): Step[] => [...steps, [4, 'check']];
    const cases = [
      [LIMPED, 4, 'limp', 'vpip'],
      [MULTIWAY, 4, 'open-raise', 'pfr'],
      [MULTIWAY, 6, 'call-raise', 'vpip'],
      [THREE_BET, 5, 'three-bet', 'pfr'],
      [afterCheck(THREE_BET), 4, 'call-three-bet', 'vpip'],
      [FOUR_BET, 5, 'call-three-bet', 'vpip'],
      [afterCheck(FOUR_BET), 4, 'four-bet', 'pfr'],
    ] as const;
    for (const [steps, seat, line, stat] of cases) {
      const view = toActView([...steps]);
      const obs = entry({ seat, hands: 50, vpip: 40, pfr: 10 });
      const range = estimateOpponentRanges(view, [obs]).find((r) => r.seat === seat);
      expect(range?.line, line).toBe(line);
      const d = widthOf(defaultRange(SIX_MAX_RANGES, range?.position ?? 'BB', line).classes);
      const other = stat === 'vpip' ? 'pfr' : 'vpip';
      expect(range?.widthPct, line).toBeCloseTo(d + ((obs[stat] - d) * 50) / 100, 9);
      expect(range?.widthPct, line).not.toBeCloseTo(d + ((obs[other] - d) * 50) / 100, 9);
      expect(range?.basis.observedHands, line).toBe(50);
    }
  });
});

describe('observed snapshot validation', () => {
  const view = toActView(MULTIWAY);

  it('throws a RangeError for invalid numbers and repeated seats', () => {
    for (const bad of [{ hands: 29.5 }, { hands: -1 }, { vpip: 101 }, { pfr: NaN }]) {
      expect(() => estimateOpponentRanges(view, [entry(bad)])).toThrow(
        new RangeError('Invalid observed stats for seat 4'),
      );
    }
    expect(() => estimateOpponentRanges(view, [entry({}), entry({ hands: 60 })])).toThrow(
      new RangeError('Observed stats list seat 4 twice'),
    );
  });

  it('ignores a snapshot that is not an array and uses default ranges', () => {
    // @ts-expect-error an untyped caller passing a non-array snapshot
    const ranges = estimateOpponentRanges(view, 'Maniac');
    expect(ranges).toEqual(estimateOpponentRanges(view));
    expect(ranges.every((r) => r.basis.text === 'typical player')).toBe(true);
  });

  it('ignores the hero, folded seats and seats not in the hand', () => {
    const snapshot = [entry({ seat: 3 }), entry({ seat: 5 }), entry({ seat: 9 as SeatNumber })];
    expect(estimateOpponentRanges(view, snapshot)).toEqual(estimateOpponentRanges(view));
  });

  it('keeps the BB check line typical', () => {
    const limped = toActView(LIMPED);
    const [bb, limper] = estimateOpponentRanges(limped, [entry({ seat: 3 }), entry({ seat: 4 })]);
    expect(bb?.line).toBe('check');
    expect(bb?.basis).toEqual({ seat: 3, observedHands: null, text: 'typical player' });
    const dead = [...limped.holeCards, ...limped.board];
    expect(bb?.start).toEqual(
      expandRange(defaultRange(SIX_MAX_RANGES, 'BB', 'check').classes, dead),
    );
    expect(limper?.line).toBe('limp');
    expect(limper?.basis.observedHands).toBe(50);
  });
});

describe('bots and unseen mode ignore observed stats', () => {
  const view = toActView(MULTIWAY);
  const snapshot = [entry({}), entry({ seat: 6 })];
  const typical = [4, 6].map((seat) => ({ seat, observedHands: null, text: 'typical player' }));

  it('drops the snapshot from bot options', () => {
    const picked = adviceOptions({ opponentRanges: 'actions', observedOpponents: snapshot });
    expect(picked).toEqual({ opponentRanges: 'actions' });
    expect(Object.hasOwn(picked, 'observedOpponents')).toBe(false);
  });

  it('reports typical players and ignores the snapshot in unseen mode', () => {
    const plain = recordingEquity();
    const withSnapshot = recordingEquity();
    const a = recommendPostflop(view, { equity: plain.fn });
    const b = recommendPostflop(view, { equity: withSnapshot.fn, observedOpponents: snapshot });
    expect(b.opponentBasis).toEqual(typical);
    expect(b).toEqual(a);
    expect(withSnapshot.calls).toEqual(plain.calls);
  });

  it('gives typical bases for the user-facing advice without a snapshot', () => {
    const rec = recommend(view, ACTION_RANGE_ADVICE);
    expect(rec.basis === 'equity' && rec.opponentBasis).toEqual(typical);
  });
});
