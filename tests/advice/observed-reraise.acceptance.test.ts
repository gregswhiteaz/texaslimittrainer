import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parsePostflopGoldenSpots } from '../../src/advice/golden';
import {
  DEFAULT_RANGES,
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  FULL_RING_RANGES,
  HEADS_UP_RANGES,
  rangesFor,
  rangeWidthPct,
  relativePfrPct,
  resizeRange,
  scaledWidthPct,
  SIX_MAX_RANGES,
  typicalPfr,
  type DefaultRanges,
  type ObservedOpponent,
  type OpponentRange,
} from '../../src/advice/ranges';
import { type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);
type Step = [SeatNumber, Action['type'], number?];

/** `seats` seats with button 1 and an ordered deck, after `steps`. */
function stateAfter(steps: readonly Step[], seats: number): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: 160 })),
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

const toActView = (steps: readonly Step[], seats: number): PlayerView => {
  const state = stateAfter(steps, seats);
  return playerView(state, state.toAct as SeatNumber);
};

const folds = (...seats: SeatNumber[]): Step[] => seats.map((seat) => [seat, 'fold']);

/** 6-max: UTG (4) opens, HJ (5) three-bets, UTG four-bets, HJ calls, UTG checks the flop; HJ to act. */
const SIX_MAX_FOUR_BET: Step[] = [
  [4, 'raise', 8],
  [5, 'raise', 12],
  ...folds(6, 1, 2, 3),
  [4, 'raise', 16],
  [5, 'call', 4],
  [4, 'check'],
];
/** 9 seats: UTG (4) opens, UTG+1 (5) three-bets, UTG four-bets, UTG+1 calls, UTG checks the flop. */
const FULL_RING_FOUR_BET: Step[] = [
  [4, 'raise', 8],
  [5, 'raise', 12],
  ...folds(6, 7, 8, 9, 1, 2, 3),
  [4, 'raise', 16],
  [5, 'call', 4],
  [4, 'check'],
];
/** Heads-up: the button (1) opens, the BB (2) three-bets, the button calls, the BB checks the flop. */
const HEADS_UP_THREE_BET: Step[] = [
  [1, 'raise', 8],
  [2, 'raise', 12],
  [1, 'call', 4],
  [2, 'check'],
];

const deadOf = (view: PlayerView) => [...view.holeCards, ...view.board];

function rangeOf(view: PlayerView, observed: ObservedOpponent[], seat: number): OpponentRange {
  const range = estimateOpponentRanges(view, observed).find((r) => r.seat === seat);
  if (range === undefined) throw new Error(`no range for seat ${seat}`);
  return range;
}

const defaultWidth = (ranges: DefaultRanges, range: OpponentRange) =>
  rangeWidthPct(defaultRange(ranges, range.position, range.line).classes);

/** The default resized to `range.widthPct` and expanded without dead cards. */
const resizedStart = (ranges: DefaultRanges, range: OpponentRange, view: PlayerView) =>
  expandRange(
    resizeRange(defaultRange(ranges, range.position, range.line).classes, range.widthPct),
    deadOf(view),
  );

describe('observed three-bet and four-bet ranges scale by PFR relative to a typical player (TASK-7.44)', () => {
  const view = toActView(SIX_MAX_FOUR_BET, 6);
  const utg = (hands: number, pfr: number) => rangeOf(view, [{ seat: 4, hands, vpip: 22, pfr }], 4);
  const d = rangeWidthPct(defaultRange(SIX_MAX_RANGES, 'UTG', 'four-bet').classes);

  it('AC#1 a 6-max UTG four-bettor with PFR 18 keeps the default width', () => {
    expect(view.seat).toBe(5);
    const range = utg(100, 18);
    expect(range.line).toBe('four-bet');
    expect(range.position).toBe('UTG');
    expect(Math.abs(range.widthPct - 2.56)).toBeLessThanOrEqual(0.01);
    expect(range.widthPct).toBeCloseTo(d, 9);
    expect(range.basis.text).toBe('based on 100 hands of this opponent');
    expect(range.start).toEqual(
      expandRange(defaultRange(SIX_MAX_RANGES, 'UTG', 'four-bet').classes, deadOf(view)),
    );
  });

  it('AC#2 PFR 45 and PFR 9 give 6.41% and 1.28%', () => {
    for (const [pfr, width] of [
      [45, 6.41],
      [9, 1.28],
    ] as const) {
      const range = utg(100, pfr);
      expect(range.line).toBe('four-bet');
      expect(Math.abs(range.widthPct - width), `PFR ${pfr}`).toBeLessThanOrEqual(0.01);
      expect(range.widthPct, `PFR ${pfr}`).toBeCloseTo((d * pfr) / 18, 9);
      expect(range.start).toEqual(resizedStart(SIX_MAX_RANGES, range, view));
    }
    const half = utg(50, 45);
    expect(Math.abs(half.widthPct - 4.4872)).toBeLessThanOrEqual(1e-4);
    expect(half.widthPct).toBeCloseTo(d + (((d * 45) / 18 - d) * 50) / 100, 9);
    expect(half.start).toEqual(resizedStart(SIX_MAX_RANGES, half, view));
  });

  it('AC#3 AC#7 heads-up and full ring use typical PFR 57.5 and 12.5, capped at 100', () => {
    expect(typicalPfr('heads-up')).toBe(57.5);
    expect(typicalPfr('6-max')).toBe(18);
    expect(typicalPfr('full-ring')).toBe(12.5);

    const ring = toActView(FULL_RING_FOUR_BET, 9);
    expect(rangesFor(9).referenceSize).toBe('full-ring');
    const ringAt = (pfr: number) => rangeOf(ring, [{ seat: 4, hands: 100, vpip: 20, pfr }], 4);
    const typical = ringAt(12.5);
    expect(typical.line).toBe('four-bet');
    expect(typical.position).toBe('UTG');
    const ringD = defaultWidth(FULL_RING_RANGES, typical);
    expect(typical.widthPct).toBeCloseTo(ringD, 9);
    expect(Math.abs(typical.widthPct - 1.21)).toBeLessThanOrEqual(0.01);
    const loose = ringAt(25);
    expect(loose.widthPct).toBeCloseTo(2 * ringD, 9);
    expect(Math.abs(loose.widthPct - 2.42)).toBeLessThanOrEqual(0.01);
    expect(loose.start).toEqual(resizedStart(FULL_RING_RANGES, loose, ring));

    const headsUp = toActView(HEADS_UP_THREE_BET, 2);
    expect(headsUp.seat).toBe(1);
    const bb = rangeOf(headsUp, [{ seat: 2, hands: 100, vpip: 80, pfr: 75 }], 2);
    expect(bb.line).toBe('three-bet');
    expect(bb.position).toBe('BB');
    expect(Math.abs(bb.widthPct - 14.16)).toBeLessThanOrEqual(0.01);
    expect(bb.widthPct).toBeCloseTo((defaultWidth(HEADS_UP_RANGES, bb) * 75) / 57.5, 9);
    expect(bb.start).toEqual(resizedStart(HEADS_UP_RANGES, bb, headsUp));

    const literal = { 'heads-up': 57.5, '6-max': 18, 'full-ring': 12.5 } as const;
    let checked = 0;
    for (const size of ['heads-up', '6-max', 'full-ring'] as const) {
      for (const range of DEFAULT_RANGES[size].ranges) {
        if (range.line !== 'three-bet' && range.line !== 'four-bet') continue;
        const rd = rangeWidthPct(range.classes);
        expect(relativePfrPct(rd, 100, typicalPfr(size))).toBe(
          Math.min(100, (rd * 100) / literal[size]),
        );
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(relativePfrPct(30, 90, 18)).toBe(100);
    expect(relativePfrPct(20, 90, 18)).toBe(100);
  });

  it('AC#4 open-raise scales by PFR and calling lines by VPIP relative to a typical player', () => {
    const cases: [Step[], SeatNumber, string, 'vpip' | 'pfr'][] = [
      [[[4, 'raise', 8], ...folds(5, 6, 1, 2), [3, 'call', 4]], 4, 'open-raise', 'pfr'],
      [
        [[4, 'raise', 8], ...folds(5), [6, 'call', 8], ...folds(1, 2), [3, 'call', 4]],
        6,
        'call-raise',
        'vpip',
      ],
      [[[4, 'call', 4], ...folds(5, 6, 1), [2, 'call', 2], [3, 'check']], 4, 'limp', 'vpip'],
      [
        [[4, 'raise', 8], [5, 'raise', 12], ...folds(6, 1, 2, 3), [4, 'call', 4], [4, 'check']],
        4,
        'call-three-bet',
        'vpip',
      ],
    ];
    for (const [steps, seat, line, stat] of cases) {
      const spot = toActView(steps, 6);
      for (const hands of [50, 100]) {
        const obs: ObservedOpponent = { seat, hands, vpip: 40, pfr: 10 };
        const range = rangeOf(spot, [obs], seat);
        expect(range.line, line).toBe(line);
        const d = defaultWidth(SIX_MAX_RANGES, range);
        const o = Math.min(100, (d * obs[stat]) / (stat === 'pfr' ? 18 : 24));
        const expected = scaledWidthPct(d, o, hands);
        expect(range.widthPct, `${line} ${hands}`).toBeCloseTo(expected, 9);
        expect(range.start, `${line} ${hands}`).toEqual(resizedStart(SIX_MAX_RANGES, range, spot));
      }
    }
  });

  it('AC#5 the 4 observed golden postflop spots agree, are clear-cut and sit at the relative-rule width', () => {
    const raw = JSON.parse(
      readFileSync(join(REPO_ROOT, 'tests/golden/postflop-spots.json'), 'utf8'),
    ) as { spots: Record<string, unknown>[] } & Record<string, unknown>;
    const withStats = raw.spots.filter((s) => s.opponentStats !== undefined);
    expect(withStats).toHaveLength(4);
    // Parsed with the real advice: it throws unless each spot still agrees and is clear-cut.
    const spots = parsePostflopGoldenSpots({ ...raw, spots: withStats }).filter(
      (s) => s.observed.length > 0,
    );
    expect(spots).toHaveLength(4);
    const typical = {
      pfr: { 'heads-up': 57.5, '6-max': 18, 'full-ring': 12.5 },
      vpip: { 'heads-up': 77.5, '6-max': 24, 'full-ring': 16.5 },
    } as const;
    const pinned: Record<string, number> = {
      '6max-flop-btn-raise-a8s': 54.7,
      '6max-turn-bb-call-a6s': 17.27,
      '6max-turn-btn-fold-55': 20.39,
      '6max-river-bb-bet-aks': 12.07,
    };
    for (const spot of spots) {
      const ranges = estimateOpponentRanges(spot.view, spot.observed);
      for (const obs of spot.observed) {
        const range = ranges.find((r) => r.seat === obs.seat) as OpponentRange;
        expect(['open-raise', 'call-raise', 'call-three-bet'], spot.id).toContain(range.line);
        const sized = rangesFor(spot.view.players.length);
        const d = defaultWidth(sized, range);
        const stat = range.line === 'open-raise' ? 'pfr' : 'vpip';
        const o = Math.min(100, (d * obs[stat]) / typical[stat][sized.referenceSize]);
        expect(range.widthPct, spot.id).toBeCloseTo(scaledWidthPct(d, o, obs.hands), 9);
        expect(Math.abs(range.widthPct - (pinned[spot.id] as number)), spot.id).toBeLessThanOrEqual(
          0.01,
        );
      }
    }
  });

  it('AC#6 range-model.md states the relative re-raise rule', () => {
    // Table cells are padded by the formatter, so runs of spaces count as one.
    const doc = readFileSync(join(REPO_ROOT, 'docs/advice/range-model.md'), 'utf8').replace(
      / {2,}/g,
      ' ',
    );
    expect(doc).toContain('| `open-raise` | d × PFR % ÷ typical PFR %, at most 100 |');
    expect(doc).toContain('| `three-bet`, `four-bet` | d × PFR % ÷ typical PFR %, at most 100 |');
    const after = doc.slice(doc.indexOf('| `check` (big blind, nobody raised)'));
    const paragraph = after.slice(after.indexOf('\n\n') + 2).split('\n\n')[0] ?? '';
    for (const text of ['57.5', '18', '12.5', '6.41%', '1.28%']) expect(paragraph).toContain(text);
    const limits = doc.slice(doc.indexOf('**Known limits.**')).split('\n\n')[0] ?? '';
    expect(limits).not.toContain('TASK-7.44');
    expect(limits.replace(/\s+/g, ' ')).not.toContain('widens those re-raise ranges a lot');
    expect(limits.replace(/\s+/g, ' ')).toContain(
      'assumes an opponent re-raises in proportion to how often they raise first',
    );
  });
});
