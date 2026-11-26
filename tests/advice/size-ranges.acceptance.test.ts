import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommendPostflop } from '../../src/advice/postflop';
import type { Position } from '../../src/advice/preflop-chart';
import {
  APPLICABLE_LINES,
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  FULL_RING_RANGES,
  HEADS_UP_RANGES,
  narrowRange,
  parseDefaultRanges,
  rangeWidthPct,
  RangeValidationError,
  type DefaultRanges,
  type NarrowingAction,
  type PreflopLine,
} from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import fullRingRaw from '../../src/advice/ranges/full-ring.json' with { type: 'json' };
import headsUpRaw from '../../src/advice/ranges/heads-up.json' with { type: 'json' };
import { REPO_ROOT } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];
const r = (seat: SeatNumber, amount: number): Step => [seat, 'raise', amount];

/** `seats` seats with button 1 and an ordered deck; returns the view of the seat to act after `steps`. */
function toActView(steps: Step[], seats: number): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: Array.from({ length: 52 }, (_, i) => i),
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, state.toAct as SeatNumber);
}

const words = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;
const keys = (ids: readonly { position: string; line: string }[]) =>
  ids.map((id) => `${id.position} ${id.line}`);

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseDefaultRanges(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(RangeValidationError);
    return (error as RangeValidationError).problems;
  }
  throw new Error('validation passed');
}

interface RawRange {
  position: string;
  line: string;
  justification: string;
  hands: string;
}
const copyOf = (raw: unknown) => JSON.parse(JSON.stringify(raw)) as { ranges: RawRange[] };
const find = (raw: { ranges: RawRange[] }, position: string, line: string) =>
  raw.ranges.find((x) => x.position === position && x.line === line) as RawRange;

/** The expected opponent: its default start for (position, line), narrowed by one flop action. */
function expectOpponent(
  view: PlayerView,
  seat: SeatNumber,
  ranges: DefaultRanges,
  position: Position,
  line: PreflopLine,
  action: NarrowingAction,
) {
  const opponent = estimateOpponentRanges(view).find((o) => o.seat === seat);
  const classes = defaultRange(ranges, position, line).classes;
  const start = expandRange(classes, [...view.holeCards, ...view.board]);
  expect(opponent).toMatchObject({ seat, position, line, widthPct: rangeWidthPct(classes) });
  expect(opponent?.start).toEqual(start);
  expect(start.length).toBeLessThan(1081);
  const narrowed = narrowRange(start, view.board, action);
  expect(narrowed.length).toBeGreaterThan(0);
  expect(opponent?.combos).toEqual(narrowed);
  return opponent;
}

/** Appendix A bands, inclusive, in % of 1,326 combos. */
const BANDS: Readonly<
  Record<'heads-up' | 'full-ring', Readonly<Record<string, [number, number]>>>
> = {
  'heads-up': {
    'BB check': [65, 90],
    'BTN limp': [10, 30],
    'BTN open-raise': [40, 70],
    'BB open-raise': [10, 30],
    'BTN call-raise': [5, 20],
    'BB call-raise': [35, 65],
    'BTN three-bet': [2, 8],
    'BB three-bet': [6, 20],
    'BTN call-three-bet': [12, 40],
    'BB call-three-bet': [8, 30],
    'BTN four-bet': [1.5, 8],
    'BB four-bet': [1.5, 8],
  },
  'full-ring': {
    'BB check': [80, 97],
    'UTG limp': [3, 14],
    'UTG+1 limp': [3, 14],
    'MP limp': [3, 14],
    'LJ limp': [3, 14],
    'HJ limp': [3, 14],
    'CO limp': [3, 14],
    'BTN limp': [5, 20],
    'SB limp': [20, 55],
    'UTG open-raise': [5, 10],
    'UTG+1 open-raise': [6, 12],
    'MP open-raise': [7, 14],
    'LJ open-raise': [8, 16],
    'HJ open-raise': [10, 19],
    'CO open-raise': [13, 25],
    'BTN open-raise': [18, 35],
    'SB open-raise': [9, 25],
    'BB open-raise': [4, 12],
    'UTG call-raise': [5, 15],
    'UTG+1 call-raise': [5, 15],
    'MP call-raise': [5, 15],
    'LJ call-raise': [5, 15],
    'HJ call-raise': [8, 20],
    'CO call-raise': [8, 22],
    'BTN call-raise': [12, 28],
    'SB call-raise': [8, 22],
    'BB call-raise': [18, 45],
    'UTG three-bet': [2, 8],
    'UTG+1 three-bet': [2, 8],
    'MP three-bet': [2, 8],
    'LJ three-bet': [2, 8],
    'HJ three-bet': [2, 8],
    'CO three-bet': [2, 8],
    'BTN three-bet': [2, 8],
    'SB three-bet': [2, 8],
    'BB three-bet': [2, 8],
    'UTG call-three-bet': [2.5, 18],
    'UTG+1 call-three-bet': [2.5, 18],
    'MP call-three-bet': [2.5, 18],
    'LJ call-three-bet': [2.5, 18],
    'HJ call-three-bet': [2.5, 18],
    'CO call-three-bet': [2.5, 18],
    'BTN call-three-bet': [2.5, 18],
    'SB call-three-bet': [2.5, 18],
    'BB call-three-bet': [2.5, 18],
    'UTG four-bet': [1, 4],
    'UTG+1 four-bet': [1, 4],
    'MP four-bet': [1, 4],
    'LJ four-bet': [1, 4],
    'HJ four-bet': [1, 4],
    'CO four-bet': [1, 4],
    'BTN four-bet': [1, 4],
    'SB four-bet': [1, 4],
    'BB four-bet': [1, 4],
  },
};

describe('heads-up and full-ring default ranges (TASK-7.26)', () => {
  it('AC#1 every heads-up and full-ring position and line has a justified range and gaps fail validation', () => {
    expect(APPLICABLE_LINES['heads-up']).toHaveLength(12);
    expect(APPLICABLE_LINES['full-ring']).toHaveLength(54);
    for (const ranges of [HEADS_UP_RANGES, FULL_RING_RANGES]) {
      expect(keys(ranges.ranges)).toEqual(keys(APPLICABLE_LINES[ranges.referenceSize]));
      expect(words(ranges.justification), ranges.referenceSize).toBeGreaterThanOrEqual(50);
      for (const range of ranges.ranges) {
        const name = `${ranges.referenceSize} ${range.position} ${range.line}`;
        expect(range.classes.size, name).toBeGreaterThanOrEqual(1);
        expect(words(range.justification), name).toBeGreaterThanOrEqual(15);
      }
    }

    const noBtnLimp = copyOf(headsUpRaw);
    noBtnLimp.ranges = noBtnLimp.ranges.filter((x) => x !== find(noBtnLimp, 'BTN', 'limp'));
    expect(problemsOf(noBtnLimp)).toEqual(['heads-up ranges: missing range BTN limp']);

    const noUtg1Open = copyOf(fullRingRaw);
    noUtg1Open.ranges = noUtg1Open.ranges.filter(
      (x) => x !== find(noUtg1Open, 'UTG+1', 'open-raise'),
    );
    expect(problemsOf(noUtg1Open)).toEqual(['full-ring ranges: missing range UTG+1 open-raise']);

    const noReason = copyOf(fullRingRaw);
    find(noReason, 'BB', 'check').justification = '';
    expect(problemsOf(noReason)).toEqual([
      'full-ring ranges: BB check is missing its plain-English justification (at least 15 words)',
    ]);

    const noHands = copyOf(headsUpRaw);
    find(noHands, 'BB', 'call-raise').hands = '';
    expect(problemsOf(noHands)).toEqual(['heads-up ranges: BB call-raise has no hands']);
  });

  it('AC#2 a heads-up opponent starts from the heads-up range for their position and line and is narrowed', () => {
    // Button 1 raises, BB 2 calls; on the flop BB checks and the button bets.
    const view = toActView([r(1, 8), c(2, 4), k(2), b(1, 4)], 2);
    expect(view.seat).toBe(2);
    expect(view.board).toHaveLength(3);
    const opponent = expectOpponent(view, 1, HEADS_UP_RANGES, 'BTN', 'open-raise', 'bet');

    const calls: EquityInput[] = [];
    const spy = (input: EquityInput): EquityResult => {
      calls.push(input);
      return {
        hero: { win: 0.5, tie: 0, equity: 0.5 },
        opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
        method: 'sampled',
        trials: 1,
      };
    };
    recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: spy });
    expect(calls[0]?.opponents[0]).toEqual(opponent?.combos);
  });

  it('AC#2 full-ring opponents at 8, 9 and 10 seats start from the full-ring range and are narrowed', () => {
    // 9 seats (SB 2, BB 3, UTG 4, UTG+1 5, MP 6, LJ 7, HJ 8, CO 9, BTN 1): MP opens, BTN and BB call; on the flop
    // BB checks, MP bets and BTN calls.
    const nine = toActView(
      [f(4), f(5), r(6, 8), f(7), f(8), f(9), c(1, 8), f(2), c(3, 4), k(3), b(6, 4), c(1, 4)],
      9,
    );
    expect(nine.seat).toBe(3);
    expectOpponent(nine, 6, FULL_RING_RANGES, 'MP', 'open-raise', 'bet');
    expectOpponent(nine, 1, FULL_RING_RANGES, 'BTN', 'call-raise', 'call');

    // 10 seats: the two seats after BB (4 and 5) are both UTG (A-2). Both limp; on the flop 4 checks and 5 bets.
    const ten = toActView(
      [c(4, 4), c(5, 4), f(6), f(7), f(8), f(9), f(10), f(1), f(2), k(3), k(3), k(4), b(5, 4)],
      10,
    );
    expect(ten.seat).toBe(3);
    expectOpponent(ten, 4, FULL_RING_RANGES, 'UTG', 'limp', 'check');
    expectOpponent(ten, 5, FULL_RING_RANGES, 'UTG', 'limp', 'bet');

    // 8 seats: nobody is UTG; the first seat after BB is UTG+1.
    const eight = toActView([c(4, 4), f(5), f(6), f(7), f(8), f(1), f(2), k(3), k(3), b(4, 4)], 8);
    expect(eight.seat).toBe(3);
    expectOpponent(eight, 4, FULL_RING_RANGES, 'UTG+1', 'limp', 'bet');
  });

  it('AC#3 every heads-up and full-ring range width lies inside its documented band', () => {
    // Table cells are padded by the formatter, so runs of spaces count as one.
    const doc = readFileSync(join(REPO_ROOT, 'docs/advice/range-model.md'), 'utf8').replace(
      / {2,}/g,
      ' ',
    );
    for (const ranges of [HEADS_UP_RANGES, FULL_RING_RANGES]) {
      const size = ranges.referenceSize as 'heads-up' | 'full-ring';
      expect(Object.keys(BANDS[size]).sort()).toEqual(keys(ranges.ranges).sort());
      for (const range of ranges.ranges) {
        const name = `${range.position} ${range.line}`;
        const [low, high] = BANDS[size][name] as [number, number];
        const pct = rangeWidthPct(range.classes);
        expect(pct, `${size} ${name}`).toBeGreaterThanOrEqual(low);
        expect(pct, `${size} ${name}`).toBeLessThanOrEqual(high);
        expect(doc).toContain(`| ${size} | ${range.position} | ${range.line} | ${low}–${high} |`);
      }
    }
  });
});
