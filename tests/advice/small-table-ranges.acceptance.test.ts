import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommendPostflop } from '../../src/advice/postflop';
import { referenceSizeOf } from '../../src/advice/preflop';
import type { Position } from '../../src/advice/preflop-chart';
import {
  DEFAULT_RANGES,
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  FULL_RING_RANGES,
  HEADS_UP_RANGES,
  narrowRange,
  PREFLOP_LINES,
  rangesFor,
  rangeWidthPct,
  SIX_MAX_RANGES,
  type NarrowingAction,
  type PreflopLine,
} from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE } from '../../src/advice/recommend';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
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

/** The expected opponent: its 6-max default start for (position, line), narrowed by one flop action. */
function expectOpponent(
  view: PlayerView,
  seat: SeatNumber,
  position: Position,
  line: PreflopLine,
  action: NarrowingAction,
) {
  const opponent = estimateOpponentRanges(view).find((o) => o.seat === seat);
  const classes = defaultRange(SIX_MAX_RANGES, position, line).classes;
  const start = expandRange(classes, [...view.holeCards, ...view.board]);
  expect(opponent).toMatchObject({ seat, position, line, widthPct: rangeWidthPct(classes) });
  expect(opponent?.start).toEqual(start);
  expect(start.length).toBeLessThan(1081);
  const narrowed = narrowRange(start, view.board, action);
  expect(narrowed.length).toBeGreaterThan(0);
  expect(opponent?.combos).toEqual(narrowed);
  return opponent;
}

// 3 seats (BTN 1, SB 2, BB 3): BTN raises, SB folds, BB calls; on the flop BB checks and BTN bets.
const threeSeats = () => toActView([r(1, 8), f(2), c(3, 4), k(3), b(1, 4)], 3);
// 4 seats (BTN 1, SB 2, BB 3, CO 4): CO limps, BTN raises, SB folds, BB and CO call; on the flop BB and CO
// check and BTN bets.
const fourSeats = () =>
  toActView([c(4, 4), r(1, 8), f(2), c(3, 4), c(4, 4), k(3), k(4), b(1, 4)], 4);

describe('6-max ranges at 3, 4, 5 and 7 seats (TASK-7.35)', () => {
  it('AC#2 rangesFor returns the heads-up ranges for 2, the 6-max ranges for 3 to 7 and the full-ring ranges for 8 to 10', () => {
    const expected = [
      [2, HEADS_UP_RANGES, 'heads-up'],
      [3, SIX_MAX_RANGES, '6-max'],
      [4, SIX_MAX_RANGES, '6-max'],
      [5, SIX_MAX_RANGES, '6-max'],
      [6, SIX_MAX_RANGES, '6-max'],
      [7, SIX_MAX_RANGES, '6-max'],
      [8, FULL_RING_RANGES, 'full-ring'],
      [9, FULL_RING_RANGES, 'full-ring'],
      [10, FULL_RING_RANGES, 'full-ring'],
    ] as const;
    for (const [seats, ranges, size] of expected) {
      const found = rangesFor(seats);
      expect(found, `${seats} seats`).toBe(ranges);
      expect(found, `${seats} seats`).toBe(DEFAULT_RANGES[referenceSizeOf(seats)]);
      expect(found.referenceSize, `${seats} seats`).toBe(size);
    }
    expect(() => rangesFor(1)).toThrow(new RangeError('No reference size for 1 dealt-in seats'));
    expect(() => rangesFor(11)).toThrow(new RangeError('No reference size for 11 dealt-in seats'));
  });

  it('AC#1 opponents at 3, 4, 5 and 7 seats start from the 6-max range for their position and line and are narrowed', () => {
    const three = threeSeats();
    expect(three.seat).toBe(3);
    expect(three.board).toHaveLength(3);
    const btn = expectOpponent(three, 1, 'BTN', 'open-raise', 'bet');

    const four = fourSeats();
    expect(four.seat).toBe(3);
    expectOpponent(four, 4, 'CO', 'call-raise', 'check');
    expectOpponent(four, 1, 'BTN', 'open-raise', 'bet');

    // 5 seats (BTN 1, SB 2, BB 3, HJ 4, CO 5): HJ raises, CO folds, BTN re-raises, blinds fold, HJ calls; on the
    // flop HJ checks and BTN bets.
    const five = toActView([r(4, 8), f(5), r(1, 12), f(2), f(3), c(4, 4), k(4), b(1, 4)], 5);
    expect(five.seat).toBe(4);
    expectOpponent(five, 1, 'BTN', 'three-bet', 'bet');

    // 7 seats: the two seats after BB (4 and 5) are both UTG (A-2). Both limp, the rest fold and BB checks; on the
    // flop BB and seat 4 check and seat 5 bets.
    const seven = toActView(
      [c(4, 4), c(5, 4), f(6), f(7), f(1), f(2), k(3), k(3), k(4), b(5, 4)],
      7,
    );
    expect(seven.seat).toBe(3);
    expectOpponent(seven, 4, 'UTG', 'limp', 'check');
    expectOpponent(seven, 5, 'UTG', 'limp', 'bet');

    // Advice weighs the hero against these ranges, not every unseen combo.
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
    recommendPostflop(three, { ...ACTION_RANGE_ADVICE, equity: spy });
    expect(calls[0]?.opponents[0]).toEqual(btn?.combos);
  });

  it('AC#1 observed stats scale a 6-max default range at a 4-seat table', () => {
    const view = fourSeats();
    const [co, btn] = [4, 1].map((seat) =>
      estimateOpponentRanges(view, [{ seat: 1, hands: 100, vpip: 70, pfr: 60 }]).find(
        (o) => o.seat === seat,
      ),
    );
    expect(btn).toMatchObject({ position: 'BTN', line: 'open-raise' });
    expect(btn?.widthPct).toBeCloseTo(60, 9);
    expect(btn?.basis).toEqual({
      seat: 1,
      observedHands: 100,
      text: 'based on 100 hands of this opponent',
    });
    expect(co?.basis.observedHands).toBeNull();
    expect(co?.start).toEqual(
      expandRange(defaultRange(SIX_MAX_RANGES, 'CO', 'call-raise').classes, [
        ...view.holeCards,
        ...view.board,
      ]),
    );
  });

  it('AC#1 the range docs say 3, 4, 5 and 7 seats use the 6-max ranges and record the effect', () => {
    const read = (file: string) =>
      readFileSync(join(REPO_ROOT, 'docs/advice', file), 'utf8').replace(/ {2,}/g, ' ');
    const model = read('range-model.md');
    expect(model).toMatch(/\| 3 to 7 \| `six-max\.json` \|/);
    for (const names of ['BTN, SB, BB', 'CO, BTN, SB, BB', 'HJ, CO, BTN, SB, BB']) {
      expect(model).toContain(names);
    }
    expect(model).toMatch(/7 seats[^.]*two seats after the big blind are both UTG/);
    expect(model).not.toContain('have no default range');
    expect(model).not.toContain('no default ranges yet');
    expect(model).not.toMatch(/(3, 4, 5 or 7|those sizes)[^.]*every unseen hand/);
    expect(model).toContain('**Fully blocked start.**');
    expect(model).toContain('Ks 8d 7c');
    for (const line of PREFLOP_LINES) expect(model).toContain(`\`${line}\``);

    const effect = model.slice(model.indexOf('### Effect at 3, 4, 5 and 7 seats (TASK-7.35)'));
    expect(effect).toContain('### Effect at 3, 4, 5 and 7 seats (TASK-7.35)');
    const section = effect.slice(0, effect.indexOf('\n## '));
    for (const seats of [3, 4, 5, 7]) {
      for (const run of ['10,000, before', '10,000, after', '100,000, after']) {
        expect(section).toContain(`| ${seats} seats ${run} |`);
      }
    }
    expect(section).toContain('| 6-max healthy |');
    expect(section).toMatch(/[Oo]utside/);
    // Review r1: every "after" stat outside its 6-max healthy range is named with its value in the misses list.
    const STATS = ['VPIP', 'PFR', 'Aggression', 'WTSD', 'W$SD'];
    const healthyRow = section.split('\n').find((l) => l.startsWith('| 6-max healthy')) ?? '';
    const healthy = healthyRow
      .split('|')
      .slice(2, 7)
      .map((c) => c.trim().split('–').map(Number));
    const misses = section.slice(section.indexOf('Stats still outside'));
    let found = 0;
    for (const row of section.split('\n').filter((l) => /^\| \d seats .*after/.test(l))) {
      const cells = row.split('|').map((c) => c.trim());
      const seats = (cells[1] ?? '').split(' ')[0];
      cells.slice(2, 7).forEach((cell, i) => {
        const [lo = NaN, hi = NaN] = healthy[i] ?? [];
        const value = Number(cell);
        if (value < lo || value > hi) {
          found++;
          expect(misses).toContain(`${seats} seats ${STATS[i]}`);
          expect(misses).toContain(cell);
        }
      });
    }
    expect(found).toBeGreaterThan(0);

    const rules = read('postflop-rules.md');
    const notYet = rules.slice(rules.indexOf('## Not applied yet'));
    const notYetSection = notYet.slice(0, notYet.indexOf('\n## ', 1));
    expect(notYetSection).not.toContain('TASK-7.35');
    expect(notYetSection).not.toContain('3, 4, 5 or 7 seats');
  });
});
