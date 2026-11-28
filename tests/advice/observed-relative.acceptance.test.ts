import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HAND_CLASSES } from '../../src/advice/hand-class';
import {
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  FULL_RING_RANGES,
  HEADS_UP_RANGES,
  rangeWidthPct,
  resizeRange,
  SIX_MAX_RANGES,
  TYPICAL_PFR,
  TYPICAL_VPIP,
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

const deadOf = (view: PlayerView) => [...view.holeCards, ...view.board];

function rangeOf(view: PlayerView, observed: ObservedOpponent[], seat: number): OpponentRange {
  const range = estimateOpponentRanges(view, observed).find((r) => r.seat === seat);
  if (range === undefined) throw new Error(`no range for seat ${seat}`);
  return range;
}

const defaultStart = (ranges: DefaultRanges, range: OpponentRange, view: PlayerView) =>
  expandRange(defaultRange(ranges, range.position, range.line).classes, deadOf(view));

/** 6-max (SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1): the button opens, SB folds, BB calls; BB to act. */
const SIX_MAX_BTN_OPEN: Step[] = [...folds(4, 5, 6), [1, 'raise', 8], [2, 'fold'], [3, 'call', 4]];

describe('observed open-raise and calling ranges scale relative to a typical player (TASK-7.48)', () => {
  it('AC#1 a 6-max BTN open-raise scales by PFR relative to the typical 18', () => {
    const view = toActView(SIX_MAX_BTN_OPEN, 6);
    expect(view.seat).toBe(3);
    const plain = estimateOpponentRanges(view).find((r) => r.seat === 1) as OpponentRange;
    const base = defaultRange(SIX_MAX_RANGES, 'BTN', 'open-raise').classes;
    for (const [pfr, width] of [
      [18, 34.54],
      [45, 86.35],
      [9, 17.27],
    ] as const) {
      const range = rangeOf(view, [{ seat: 1, hands: 100, vpip: 30, pfr }], 1);
      expect(range.line).toBe('open-raise');
      expect(range.position).toBe('BTN');
      expect(range.widthPct, `PFR ${pfr}`).toBeCloseTo(width, 2);
      expect(range.start).toEqual(expandRange(resizeRange(base, range.widthPct), deadOf(view)));
      if (pfr === 18) expect(range.start).toEqual(plain.start);
    }
  });

  it('AC#2 a 6-max BB call-raise scales by VPIP relative to the typical 24, at most 100', () => {
    const view = toActView([...SIX_MAX_BTN_OPEN, [3, 'check']], 6);
    expect(view.seat).toBe(1);
    const base = defaultRange(SIX_MAX_RANGES, 'BB', 'call-raise').classes;
    for (const [vpip, width] of [
      [24, 41.48],
      [40, 69.13],
      [12, 20.74],
    ] as const) {
      const range = rangeOf(view, [{ seat: 3, hands: 100, vpip, pfr: 10 }], 3);
      expect(range.line).toBe('call-raise');
      expect(range.position).toBe('BB');
      expect(Math.abs(range.widthPct - width), `VPIP ${vpip}`).toBeLessThanOrEqual(0.01);
      expect(range.start).toEqual(expandRange(resizeRange(base, range.widthPct), deadOf(view)));
    }
    const capped = rangeOf(view, [{ seat: 3, hands: 100, vpip: 60, pfr: 10 }], 3);
    expect(capped.widthPct).toBe(100);
    expect(capped.start).toEqual(expandRange(new Set(HAND_CLASSES), deadOf(view)));
  });

  it('AC#3 heads-up and full ring use their own typical PFR and VPIP', () => {
    expect([TYPICAL_PFR['heads-up'], TYPICAL_PFR['full-ring']]).toEqual([57.5, 12.5]);
    expect([TYPICAL_VPIP['heads-up'], TYPICAL_VPIP['full-ring']]).toEqual([77.5, 16.5]);

    // Heads-up: the button (1) limps, the BB (2) raises, the button calls; BB to act.
    const limped = toActView(
      [
        [1, 'call', 2],
        [2, 'raise', 8],
        [1, 'call', 4],
      ],
      2,
    );
    expect(limped.seat).toBe(2);
    const caller = rangeOf(limped, [{ seat: 1, hands: 100, vpip: 77.5, pfr: 57.5 }], 1);
    expect(caller.line).toBe('call-raise');
    expect(Math.abs(caller.widthPct - 11.76)).toBeLessThanOrEqual(0.01);
    expect(caller.start).toEqual(defaultStart(HEADS_UP_RANGES, caller, limped));

    // Heads-up: the button opens, the BB calls; BB to act.
    const opened = toActView(
      [
        [1, 'raise', 8],
        [2, 'call', 4],
      ],
      2,
    );
    const opener = rangeOf(opened, [{ seat: 1, hands: 100, vpip: 77.5, pfr: 57.5 }], 1);
    expect(opener.line).toBe('open-raise');
    expect(opener.start).toEqual(defaultStart(HEADS_UP_RANGES, opener, opened));
    expect(opener.widthPct).toBeCloseTo(
      rangeWidthPct(defaultRange(HEADS_UP_RANGES, opener.position, 'open-raise').classes),
      9,
    );

    // 9 and 10 seats: UTG (4) opens, everyone else folds to the BB (3), who calls and checks the flop.
    for (const seats of [9, 10]) {
      const others = Array.from({ length: seats - 4 }, (_, i) => i + 5);
      const view = toActView(
        [[4, 'raise', 8], ...folds(...others, 1, 2), [3, 'call', 4], [3, 'check']],
        seats,
      );
      expect(view.seat).toBe(4);
      const bb = rangeOf(view, [{ seat: 3, hands: 100, vpip: 33, pfr: 10 }], 3);
      expect(bb.line).toBe('call-raise');
      expect(bb.position).toBe('BB');
      expect(Math.abs(bb.widthPct - 55.2), `${seats} seats`).toBeLessThanOrEqual(0.01);
      expect(bb.start).toEqual(
        expandRange(
          resizeRange(defaultRange(FULL_RING_RANGES, 'BB', 'call-raise').classes, bb.widthPct),
          deadOf(view),
        ),
      );
    }
  });

  it('AC#7 range-model.md states the relative rule for open-raise and calling lines', () => {
    // Table cells are padded by the formatter, so runs of spaces count as one.
    const doc = readFileSync(join(REPO_ROOT, 'docs/advice/range-model.md'), 'utf8').replace(
      / {2,}/g,
      ' ',
    );
    expect(doc).toContain('| `open-raise` | d × PFR % ÷ typical PFR %, at most 100 |');
    expect(doc).toContain(
      '| `limp`, `call-raise`, `call-three-bet` | d × VPIP % ÷ typical VPIP %, at most 100 |',
    );
    expect(doc).not.toContain('| PFR % |');
    expect(doc).not.toContain('| VPIP % |');
    const after = doc.slice(doc.indexOf('| `check` (big blind, nobody raised)'));
    const paragraph = after.slice(after.indexOf('\n\n') + 2).split('\n\n')[0] ?? '';
    for (const text of ['77.5', '24', '16.5', '34.54%', '86.35%', '41.48%', '69.13%']) {
      expect(paragraph).toContain(text);
    }
    const limits = (doc.slice(doc.indexOf('**Known limits.**')).split('\n\n')[0] ?? '').replace(
      /\s+/g,
      ' ',
    );
    expect(limits).toContain('no per-seat stats');
    expect(limits).toContain('53.8');
  });
});
