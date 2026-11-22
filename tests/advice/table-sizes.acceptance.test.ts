import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, handClassAt, type HandClass } from '../../src/advice/hand-class';
import {
  APPLICABLE_SPOTS,
  ChartValidationError,
  chartCell,
  parseChart,
  SEATS_BEFORE_BUTTON,
  type ChartAction,
  type Position,
  type PreflopChart,
  type ReferenceSize,
  type Situation,
} from '../../src/advice/preflop-chart';
import {
  FULL_RING_CHART,
  HEADS_UP_CHART,
  PREFLOP_CHARTS,
  recommendPreflop,
} from '../../src/advice/preflop';
import { recommend } from '../../src/advice/recommend';
import { RANK_CHARS, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const CHARTS_DIR = join(REPO_ROOT, 'src/advice/charts');
const FILES: Readonly<Record<ReferenceSize, string>> = {
  'heads-up': 'heads-up.json',
  '6-max': 'six-max.json',
  'full-ring': 'full-ring.json',
};
const SITUATIONS: readonly Situation[] = [
  'unopened',
  'limpers',
  'raise',
  'raise-and-calls',
  're-raise',
  'blind-defence',
];

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const r = (seat: SeatNumber, to: number): Step => [seat, 'raise', to];

/** One representative combo: pair = spade + heart, suited = spades, offsuit = spade high + heart low. */
function cardsOf(hc: HandClass): [Card, Card] {
  const high = RANK_CHARS.indexOf(hc.charAt(0));
  const low = RANK_CHARS.indexOf(hc.charAt(1));
  return [high * 4 + 3, low * 4 + (hc.endsWith('s') ? 3 : 2)];
}

/** Seats 1..n with button 1 and `hero` dealt a combo of `hc`, after `steps`. */
function viewAt(n: number, hero: SeatNumber, hc: HandClass, steps: Step[] = []): PlayerView {
  const cards = cardsOf(hc);
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((x) => !cards.includes(x));
  // Cards are dealt clockwise from the seat after the button: seat 2 first, the button last.
  const index = hero === 1 ? n - 1 : hero - 2;
  deck.splice(index, 0, cards[0]);
  deck.splice(index + n, 0, cards[1]);
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  expect(state.toAct).toBe(hero);
  return playerView(state, hero);
}

const readChart = (size: ReferenceSize) =>
  JSON.parse(readFileSync(join(CHARTS_DIR, FILES[size]), 'utf8')) as {
    justification: unknown;
    spots: { position: string; situation: string; justification: unknown; grid: string[] }[];
  };

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseChart(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(ChartValidationError);
    return (error as ChartValidationError).problems;
  }
  return [];
}

const classWith = (chart: PreflopChart, p: Position, s: Situation, action: ChartAction) =>
  HAND_CLASSES.find((hc) => chartCell(chart, p, s, hc).action === action);

const expectChartCell = (view: PlayerView) => {
  const rec = recommendPreflop(view);
  expect(rec.cell).toEqual(
    chartCell(PREFLOP_CHARTS[rec.referenceSize], rec.position, rec.situation, rec.handClass),
  );
  return rec;
};

const NEW_SIZES: readonly ReferenceSize[] = ['heads-up', 'full-ring'];

describe('preflop charts for every table size', () => {
  it('AC#1 heads-up, 6-max and full-ring charts exist and a missing chart fails', () => {
    expect(Object.keys(PREFLOP_CHARTS).sort()).toEqual(['6-max', 'full-ring', 'heads-up']);
    for (const [size, chart] of Object.entries(PREFLOP_CHARTS)) {
      expect(chart.referenceSize).toBe(size);
    }
    const files = readdirSync(CHARTS_DIR);
    for (const size of Object.keys(FILES) as ReferenceSize[]) {
      expect(files).toContain(FILES[size]);
      expect(parseChart(readChart(size)).referenceSize).toBe(size);
    }

    for (const size of NEW_SIZES) {
      const empty = { ...readChart(size), spots: [] };
      expect(problemsOf(empty)).toEqual(
        APPLICABLE_SPOTS[size].map(
          (s) => `${size} chart: missing spot ${s.position} ${s.situation}`,
        ),
      );
    }
    expect(problemsOf(undefined)).toEqual([
      'Chart file: expected format "tlh-preflop-chart" version 1',
    ]);
  });

  it('AC#2 every heads-up and full-ring spot assigns all 169 hand classes', () => {
    expect(APPLICABLE_SPOTS['heads-up']).toHaveLength(6);
    expect(APPLICABLE_SPOTS['full-ring']).toHaveLength(41);
    for (const size of NEW_SIZES) {
      const chart = PREFLOP_CHARTS[size];
      expect(chart.spots.map((s) => ({ position: s.position, situation: s.situation }))).toEqual(
        APPLICABLE_SPOTS[size],
      );
      // Heads-up nobody can call a raise before the hero acts again, so raise-and-calls can't arise there.
      const reachable =
        size === 'heads-up' ? SITUATIONS.filter((s) => s !== 'raise-and-calls') : SITUATIONS;
      expect([...new Set(APPLICABLE_SPOTS[size].map((s) => s.situation))].sort()).toEqual(
        [...reachable].sort(),
      );
      for (const spot of chart.spots) {
        expect(Object.keys(spot.cells).sort()).toEqual([...HAND_CLASSES].sort());
      }

      const data = readChart(size);
      const last = data.spots[data.spots.length - 1] as (typeof data.spots)[number];
      const tokens = (last.grid[4] as string).trim().split(/\s+/);
      tokens[7] = '-';
      last.grid[4] = tokens.join(' ');
      expect(problemsOf(data)).toEqual([
        `${size} chart: ${last.position} ${last.situation} ${handClassAt(4, 7)} has no action`,
      ]);

      const missing = readChart(size);
      const removed = missing.spots.splice(1, 1)[0] as (typeof missing.spots)[number];
      expect(problemsOf(missing)).toEqual([
        `${size} chart: missing spot ${removed.position} ${removed.situation}`,
      ]);
    }
  });

  it('AC#3 a chart without justification fails naming the chart', () => {
    for (const size of NEW_SIZES) {
      expect(problemsOf({ ...readChart(size), justification: '' })).toEqual([
        `${size} chart: missing plain-English justification (at least 50 words)`,
      ]);
      const data = readChart(size);
      const spot = data.spots[2] as (typeof data.spots)[number];
      spot.justification = '';
      expect(problemsOf(data)).toEqual([
        `${size} chart: spot ${spot.position} ${spot.situation} is missing its plain-English justification (at least 15 words)`,
      ]);
    }
  });

  it('AC#4 the chart used is heads-up for 2, 6-max for 3 to 7 and full ring for 8 to 10', () => {
    const expected: Record<number, ReferenceSize> = {
      2: 'heads-up',
      3: '6-max',
      4: '6-max',
      5: '6-max',
      6: '6-max',
      7: '6-max',
      8: 'full-ring',
      9: 'full-ring',
      10: 'full-ring',
    };
    for (let n = 2; n <= 10; n++) {
      // Every seat in turn folds to the big blind; each decision reads its size's chart.
      const firstToAct: SeatNumber = n <= 3 ? 1 : 4;
      const order = Array.from(
        { length: n },
        (_, i) => (((firstToAct - 1 + i) % n) + 1) as SeatNumber,
      );
      const bb: SeatNumber = n === 2 ? 2 : 3;
      const steps: Step[] = [];
      for (const seat of order.slice(0, order.indexOf(bb))) {
        for (const hc of ['AKs', '72o', 'T9s'] as HandClass[]) {
          const view = viewAt(n, seat, hc, steps);
          const rec = expectChartCell(view);
          expect(rec.referenceSize, `${n} seats, seat ${seat}`).toBe(expected[n]);
          expect(recommend(view)).toEqual(rec);
        }
        steps.push(f(seat));
      }
    }
  });

  it('AC#5 heads-up button advice comes from the heads-up chart cell', () => {
    for (const hc of HAND_CLASSES) {
      const rec = recommendPreflop(viewAt(2, 1, hc));
      const cell = chartCell(HEADS_UP_CHART, 'BTN', 'unopened', hc);
      expect(rec).toMatchObject({
        referenceSize: 'heads-up',
        position: 'BTN',
        situation: 'unopened',
        handClass: hc,
        cell,
        action: cell.action,
      });
    }
  });

  it('AC#6 AC#7 a capped fourth bet uses the re-raise cell and caps raise to call', () => {
    const huRaise = classWith(HEADS_UP_CHART, 'BB', 're-raise', 'raise');
    expect(huRaise).toBeDefined();
    const hu = viewAt(2, 2, huRaise as HandClass, [r(1, 8), r(2, 12), r(1, 16)]);
    expect(hu.betCount).toBe(4);
    const huRec = recommendPreflop(hu);
    expect(huRec).toMatchObject({
      referenceSize: 'heads-up',
      position: 'BB',
      situation: 're-raise',
      cell: chartCell(HEADS_UP_CHART, 'BB', 're-raise', huRaise as HandClass),
      action: 'call',
    });
    expect(huRec.cell.action).toBe('raise');
    expect(huRec.move).toEqual({ seat: 2, type: 'call', amount: 4 });

    // Nine-handed: UTG (seat 4) raises, the CO (seat 9) re-raises, the BB (seat 3) re-raises.
    const steps: Step[] = [r(4, 8), f(5), f(6), f(7), f(8), r(9, 12), f(1), f(2), r(3, 16)];
    const raiseClass = classWith(FULL_RING_CHART, 'UTG', 're-raise', 'raise');
    const foldClass = classWith(FULL_RING_CHART, 'UTG', 're-raise', 'fold');
    expect(raiseClass).toBeDefined();
    expect(foldClass).toBeDefined();
    const capped = viewAt(9, 4, raiseClass as HandClass, steps);
    expect(capped.betCount).toBe(4);
    const called = recommendPreflop(capped);
    const folded = recommendPreflop(viewAt(9, 4, foldClass as HandClass, steps));
    for (const rec of [called, folded]) {
      expect(rec).toMatchObject({
        referenceSize: 'full-ring',
        position: 'UTG',
        situation: 're-raise',
      });
    }
    expect(called.cell.action).toBe('raise');
    expect(called.action).toBe('call');
    expect(called.move).toEqual({ seat: 4, type: 'call', amount: 8 });
    expect(folded.action).toBe('fold');
  });

  it('AC#8 the first seat to act maps by seats before the button', () => {
    const at = (n: number, hero: SeatNumber, steps: Step[] = []) =>
      expectChartCell(viewAt(n, hero, 'AJo', steps));
    expect(at(4, 4)).toMatchObject({ referenceSize: '6-max', position: 'CO' });
    expect(at(5, 4)).toMatchObject({ referenceSize: '6-max', position: 'HJ' });
    expect(at(7, 4)).toMatchObject({
      referenceSize: '6-max',
      position: 'UTG',
      situation: 'unopened',
    });
    expect(at(7, 5, [f(4)])).toMatchObject({
      referenceSize: '6-max',
      position: 'UTG',
      situation: 'unopened',
    });
    // The second UTG seat facing the first one's limp reads the next-later limpers spot (6-max HJ).
    expect(at(7, 5, [c(4, 4)])).toMatchObject({
      referenceSize: '6-max',
      position: 'HJ',
      situation: 'limpers',
    });
    const eight = at(8, 4);
    expect(eight.referenceSize).toBe('full-ring');
    expect(eight.position).toBe(SEATS_BEFORE_BUTTON['full-ring'][5]);
    expect(eight.position).toBe('UTG+1');
  });
});
