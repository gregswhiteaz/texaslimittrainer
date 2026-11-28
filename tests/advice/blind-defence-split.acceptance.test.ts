import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { chartBasisText, situationLabel } from '../../src/advice/explain';
import { fillTemplate, PREFLOP_CONTEXT, SITUATION_LABELS } from '../../src/advice/explanations';
import { sentencesOf } from '../../src/advice/golden';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import {
  APPLICABLE_SPOTS,
  chartCell,
  EARLY_RAISERS,
  type ChartAction,
  type ChartCell,
  type ChartSpot,
  type Position,
  type PreflopChart,
  type ReferenceSize,
  type Situation,
} from '../../src/advice/preflop-chart';
import {
  chartSpotOf,
  FULL_RING_CHART,
  PREFLOP_CHARTS,
  recommendPreflop,
  situationOf,
  SIX_MAX_CHART,
} from '../../src/advice/preflop';
import { decideRock, ROCK_STYLE } from '../../src/bots/rock';
import { startingRangeFor } from '../../src/bots/style';
import { RANK_CHARS, type Card } from '../../src/engine/cards';
import { applyAction, createHand, legalActions, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { REPO_ROOT, sandboxEnv, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const RANKS = 'AKQJT98765432';
const CONTINUE: ChartAction[] = ['call', 'raise'];
const BLINDS = ['SB', 'BB'] as const;

/** A step names only the seat and the action type; call and raise amounts come from the legal actions (A-5). */
type Step = [SeatNumber, 'fold' | 'call' | 'raise'];
const f = (seat: number): Step => [seat as SeatNumber, 'fold'];
const c = (seat: number): Step => [seat as SeatNumber, 'call'];
const r = (seat: number): Step => [seat as SeatNumber, 'raise'];
const folds = (from: number, to: number): Step[] =>
  Array.from({ length: to - from + 1 }, (_, i) => f(from + i));

interface Route {
  name: string;
  seats: number;
  hero: SeatNumber;
  steps: Step[];
  position: Position;
  situation: Situation;
}

const route = (
  name: string,
  seats: number,
  steps: Step[],
  hero: number,
  position: Position,
  situation: Situation,
): Route => ({ name, seats, hero: hero as SeatNumber, steps, position, situation });

/** One representative combo: pair = spade + heart, suited = spades, offsuit = spade high + heart low. */
function cardsOf(hc: HandClass): [Card, Card] {
  const high = RANK_CHARS.indexOf(hc.charAt(0));
  const low = RANK_CHARS.indexOf(hc.charAt(1));
  return [high * 4 + 3, low * 4 + (hc.endsWith('s') ? 3 : 2)];
}

/** Button 1, seats 1..n; seat 2 is dealt first, so the hero's cards go to deck[hero - 2] and deck[hero - 2 + n]. */
function viewAt(route: Route, hc: HandClass): PlayerView {
  const n = route.seats;
  const cards = cardsOf(hc);
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((x) => !cards.includes(x));
  const index = (route.hero + n - 2) % n;
  deck.splice(index, 0, cards[0]);
  deck.splice(index + n, 0, cards[1]);
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: n }, (_, i) => ({ seat: (i + 1) as SeatNumber, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type] of route.steps) {
    const action = legalActions(state).find((a) => a.type === type);
    if (state.toAct !== seat || action === undefined) {
      throw new Error(`${route.name}: seat ${seat} cannot ${type}`);
    }
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${route.name}: ${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, route.hero);
}

const E = 'blind-defence-early';
const L = 'blind-defence';

/** Spec §5 rule 4: 6 seats SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1; 9 seats SB 2, BB 3, UTG 4 … CO 9, BTN 1. */
const ROUTES: Route[] = [
  route('B1', 6, [r(4), f(5), f(6), f(1), f(2)], 3, 'BB', E),
  route('B2', 6, [f(4), r(5), f(6), f(1)], 2, 'SB', E),
  route('B3', 6, [f(4), f(5), r(6), f(1), f(2)], 3, 'BB', L),
  route('B4', 6, [f(4), f(5), f(6), r(1)], 2, 'SB', L),
  route('B5 SB raiser', 6, [f(4), f(5), f(6), f(1), r(2)], 3, 'BB', L),
  route('B6 BB raiser', 6, [f(4), f(5), f(6), f(1), c(2), r(3)], 2, 'SB', L),
  route('B7 isolation by HJ', 6, [c(4), r(5), f(6), f(1), f(2)], 3, 'BB', E),
  route('B8 BTN isolates two limpers', 6, [c(4), c(5), f(6), r(1)], 2, 'SB', L),
  route('B9 raise and a call', 6, [r(4), c(5), f(6), f(1)], 2, 'SB', E),
  route('B10 second UTG seat', 7, [f(4), r(5), f(6), f(7), f(1)], 2, 'SB', E),
  route('B11 HJ is earliest', 5, [r(4), f(5), f(1), f(2)], 3, 'BB', E),
  route('B12 CO', 4, [r(4), f(1), f(2)], 3, 'BB', L),
  route('B13 BTN', 3, [r(1), f(2)], 3, 'BB', L),
  route('B14 heads-up', 2, [r(1)], 2, 'BB', L),
  route('F1 UTG', 9, [r(4), ...folds(5, 9), f(1), f(2)], 3, 'BB', E),
  route('F2 LJ', 9, [f(4), f(5), f(6), r(7), f(8), f(9), f(1)], 2, 'SB', E),
  route('F3 HJ', 9, [...folds(4, 7), r(8), f(9), f(1), f(2)], 3, 'BB', L),
  route('F4 BTN', 9, [...folds(4, 9), r(1)], 2, 'SB', L),
  route('F5 isolation by MP', 9, [c(4), f(5), r(6), f(7), f(8), f(9), f(1), f(2)], 3, 'BB', E),
  route('F6 BB raiser', 9, [...folds(4, 9), f(1), c(2), r(3)], 2, 'SB', L),
  route('F7 UTG+1 is earliest', 8, [r(4), ...folds(5, 8), f(1), f(2)], 3, 'BB', E),
  route('F8 second UTG seat', 10, [f(4), r(5), ...folds(6, 10), f(1)], 2, 'SB', E),
  route('F9 HJ', 10, [...folds(4, 8), r(9), f(10), f(1), f(2)], 3, 'BB', L),
];

const routeNamed = (name: string) => ROUTES.find((x) => x.name.split(' ')[0] === name) as Route;
const nameOf = (spot: ChartSpot) => `${spot.position} ${spot.situation}`;
const spotIn = (chart: PreflopChart, position: Position, situation: Situation) =>
  chart.spots.find((s) => s.position === position && s.situation === situation) as ChartSpot;
const cellOf = (spot: ChartSpot, hc: HandClass) => spot.cells[hc] as ChartCell;
const classesWith = (spot: ChartSpot, actions: ChartAction[]): HandClass[] =>
  HAND_CLASSES.filter((hc) => actions.includes(cellOf(spot, hc).action));
const combos = (classes: Iterable<HandClass>) =>
  [...classes].reduce((sum, hc) => sum + comboCount(hc), 0);
const percent = (classes: HandClass[]) => (combos(classes) / 1326) * 100;
const wordCount = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;

const LETTER = { fold: 'F', call: 'C', raise: 'R' } as const;
const token = (cell: ChartCell) =>
  LETTER[cell.action] +
  (cell.borderline ? '*' : '') +
  (cell.alternative === null ? '' : '/' + LETTER[cell.alternative]);

/** A-4: fold 0; borderline fold 1; borderline call/raise leaning to fold (or no alternative) 2; else 3. */
function level(cell: ChartCell): number {
  if (cell.action === 'fold') return cell.borderline ? 1 : 0;
  return cell.borderline && (cell.alternative === null || cell.alternative === 'fold') ? 2 : 3;
}

/** Pairs [Y, X] where Y dominates X under A-4. Rank index 0 = A ... 12 = 2. */
function dominancePairs(): [HandClass, HandClass][] {
  const pairs: [HandClass, HandClass][] = [];
  for (let yh = 0; yh < 13; yh++) {
    for (let yl = yh + 1; yl < 13; yl++) {
      for (let xh = yh; xh < 13; xh++) {
        for (let xl = Math.max(yl, xh + 1); xl < 13; xl++) {
          if (xh === yh && xl === yl) continue;
          const y = (RANKS[yh] as string) + RANKS[yl];
          const x = (RANKS[xh] as string) + RANKS[xl];
          pairs.push([`${y}o`, `${x}o`]);
          // Suited: same high card, Y has the higher kicker, X's kicker is 6 or higher.
          if (xh === yh && xl <= RANKS.indexOf('6')) pairs.push([`${y}s`, `${x}s`]);
        }
      }
    }
  }
  return pairs;
}

function inversions(spot: ChartSpot): string[] {
  return dominancePairs()
    .filter(([y, x]) => level(cellOf(spot, y)) < level(cellOf(spot, x)))
    .map(
      ([y, x]) =>
        `${nameOf(spot)}: ${y}:${token(cellOf(spot, y))} < ${x}:${token(cellOf(spot, x))}`,
    );
}

/** Q-4 continue bands for `P blind-defence-early`. */
const BANDS: Record<'6-max' | 'full-ring', Record<'SB' | 'BB', [number, number]>> = {
  '6-max': { SB: [5, 9], BB: [28, 40] },
  'full-ring': { SB: [4, 7.5], BB: [20, 30] },
};

/** Spec §5 rules 5 and 6 for `P blind-defence-early` with the given cells. */
function earlyProblems(
  size: '6-max' | 'full-ring',
  position: 'SB' | 'BB',
  cells: ChartSpot['cells'],
): { early: number; late: number; problems: string[] } {
  const chart = PREFLOP_CHARTS[size];
  const name = `${position} ${E}`;
  const late = spotIn(chart, position, L);
  const spot = { ...spotIn(chart, position, E), cells };
  const problems: string[] = [];
  for (const hc of HAND_CLASSES) {
    const cell = cellOf(spot, hc);
    if (cell.action !== 'fold' && cellOf(late, hc).action === 'fold') {
      problems.push(`${name}: ${hc} continues but folds in ${nameOf(late)}`);
    }
    if (level(cell) > level(cellOf(late, hc))) {
      problems.push(`${name}: ${hc} plays firmer than in ${nameOf(late)}`);
    }
    if (cell.alternative !== null && !cell.borderline) {
      problems.push(`${name}: ${hc} has an alternative but is not borderline`);
    }
  }
  const cont = classesWith(spot, CONTINUE);
  const lateCombos = combos(classesWith(late, CONTINUE));
  if (combos(cont) >= lateCombos) {
    problems.push(`${name}: ${combos(cont)} combos, not fewer than ${lateCombos}`);
  }
  const early = percent(cont);
  const [low, high] = BANDS[size][position];
  if (early < low || early > high) {
    problems.push(`${name}: continue ${early.toFixed(1)}% outside ${low}–${high}%`);
  }
  if (cellOf(spot, '72o').action !== 'fold') problems.push(`${name}: 72o does not fold`);
  const plain = HAND_CLASSES.map((hc) => cellOf(spot, hc)).filter((cell) => !cell.borderline);
  if (!plain.some((cell) => cell.action === 'raise')) problems.push(`${name}: no firm raise`);
  if (!plain.some((cell) => cell.action === 'fold')) problems.push(`${name}: no firm fold`);
  if (wordCount(spot.justification) < 15) problems.push(`${name}: justification too short`);
  problems.push(...inversions(spot));
  return { early, late: (lateCombos / 1326) * 100, problems };
}

function checkAllClasses(route: Route): void {
  const chart =
    PREFLOP_CHARTS[route.seats === 2 ? 'heads-up' : route.seats <= 7 ? '6-max' : 'full-ring'];
  for (const hc of HAND_CLASSES) {
    const view = viewAt(route, hc);
    const rec = recommendPreflop(view);
    const where = `${route.name} ${hc}`;
    expect([rec.position, rec.situation], where).toEqual([route.position, route.situation]);
    expect(situationOf(view), where).toBe(route.situation);
    expect(rec.cell, where).toEqual(chartCell(chart, route.position, route.situation, hc));
    expect(view.legalActions, where).toContainEqual(rec.move);
    expect(rec.move.type, where).toBe(rec.action);
  }
}

/** The D-2 order of a chart: every spot before blind defence as today, then early SB, BB, late SB, BB. */
function d2Order(size: ReferenceSize): string[] {
  const rest = APPLICABLE_SPOTS[size]
    .map((s) => `${s.position} ${s.situation}`)
    .filter((k) => !k.endsWith(` ${E}`) && !k.endsWith(` ${L}`));
  return [
    ...rest,
    'SB blind-defence-early',
    'BB blind-defence-early',
    'SB blind-defence',
    'BB blind-defence',
  ];
}

describe('blind defence split by the raiser (TASK-7.42)', () => {
  it("AC#1 a blind facing one raise reads the early or late spot by the raiser's seat", () => {
    expect(EARLY_RAISERS).toEqual({
      'heads-up': [],
      '6-max': ['UTG', 'HJ'],
      'full-ring': ['UTG', 'UTG+1', 'MP', 'LJ'],
    });
    expect(ROUTES).toHaveLength(23);
    for (const r of ROUTES) checkAllClasses(r);
  });

  it(
    'AC#2 the charts have 34 and 52 spots with all 169 classes',
    () => {
      for (const [size, length] of [
        ['6-max', 34],
        ['full-ring', 52],
      ] as const) {
        const order = d2Order(size);
        expect(order, size).toHaveLength(length);
        expect(
          APPLICABLE_SPOTS[size].map((s) => `${s.position} ${s.situation}`),
          size,
        ).toEqual(order);
        const chart = PREFLOP_CHARTS[size];
        expect(chart.spots.map(nameOf), size).toEqual(order);
        for (const spot of chart.spots) {
          expect(Object.keys(spot.cells).sort(), `${size} ${nameOf(spot)}`).toEqual(
            [...HAND_CLASSES].sort(),
          );
        }
        for (const position of BLINDS) {
          for (const situation of [E, L] as const) {
            const spot = spotIn(chart, position, situation);
            expect(wordCount(spot.justification), `${size} ${nameOf(spot)}`).toBeGreaterThanOrEqual(
              15,
            );
          }
        }
      }
      expect(APPLICABLE_SPOTS['heads-up']).toHaveLength(6);
      expect(APPLICABLE_SPOTS['heads-up'].some((s) => s.situation === E)).toBe(false);

      for (const [args, first] of [
        [['6-max'], '6-max chart: 34 spots'],
        [['full-ring'], 'full-ring chart: 52 spots'],
      ] as const) {
        const run = spawnSync(
          process.execPath,
          ['--import', './tools/playtest/resolve-ts.js', 'tools/chart-print/main.ts', ...args],
          { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8' },
        );
        expect(run.status).toBe(0);
        expect(run.stdout.split('\n')[0]).toBe(first);
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('AC#2 each blind defends no wider against an early raiser than against a late one', () => {
    for (const size of ['6-max', 'full-ring'] as const) {
      for (const position of BLINDS) {
        const spot = spotIn(PREFLOP_CHARTS[size], position, E);
        const { early, late, problems } = earlyProblems(size, position, spot.cells);
        console.log(`${size} ${position}: early ${early.toFixed(1)}% vs late ${late.toFixed(1)}%`);
        expect(problems, `${size} ${position}`).toEqual([]);
      }
    }

    // Mutation: the late BB grid copied into the early spot is not narrower and leaves the band.
    const copied = earlyProblems('6-max', 'BB', spotIn(SIX_MAX_CHART, 'BB', L).cells).problems;
    expect(copied.some((p) => p.includes('not fewer than'))).toBe(true);
    expect(copied.some((p) => p.includes('outside 28–40%'))).toBe(true);
    const fullRing = earlyProblems('full-ring', 'BB', spotIn(FULL_RING_CHART, 'BB', L).cells);
    expect(fullRing.problems.some((p) => p.includes('not fewer than'))).toBe(true);
  });

  it('AC#3 the early-raiser spot shows the approved label and context sentence', () => {
    const context =
      'Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, but a raiser in an early seat holds a strong range, so you defend with fewer hands than against a late raiser.';
    const label = 'defending the blind against an early raiser';
    expect(PREFLOP_CONTEXT[E]).toBe(context);
    expect(SITUATION_LABELS[E]).toBe(label);
    expect(situationLabel(E)).toBe(label);
    expect(PREFLOP_CONTEXT[L]).toBe(
      'Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, so you can defend with more hands than other seats.',
    );
    expect(SITUATION_LABELS[L]).toBe('defending the blind against a raise');
    const situations = [
      'unopened',
      'limpers',
      'raise',
      'raise-and-calls',
      're-raise',
      're-raise-not-mine',
      E,
      L,
    ];
    expect(Object.keys(PREFLOP_CONTEXT)).toEqual(situations);
    expect(Object.keys(SITUATION_LABELS)).toEqual(situations);

    for (const [name, hc, size] of [
      ['B1', 'K8o', '6-max'],
      ['F1', 'A9o', 'full-ring'],
    ] as const) {
      const rec = recommendPreflop(viewAt(routeNamed(name), hc));
      expect([rec.referenceSize, rec.situation], name).toEqual([size, E]);
      expect(rec.explanation.startsWith(fillTemplate(context, {}) + ' '), name).toBe(true);
      expect(sentencesOf(rec.explanation).length, name).toBeLessThanOrEqual(3);
      expect(chartBasisText(rec), name).not.toContain(label);
    }
  });

  it('AC#4 Rock has a strict-subset range for each new 6-max spot', () => {
    const expected = {
      SB: 'AA KK QQ JJ TT AKs AQs AKo',
      BB: 'AA KK QQ JJ TT 99 88 77 66 55 44 33 22 AKs AQs AJs ATs KQs KJs QJs JTs AKo AQo KQo',
    };
    for (const position of BLINDS) {
      const early = startingRangeFor(ROCK_STYLE, position, E);
      const late = startingRangeFor(ROCK_STYLE, position, L);
      expect(early, position).toBeDefined();
      const hands = [...(early?.hands ?? [])];
      expect([...hands].sort(), position).toEqual(expected[position].split(' ').sort());
      const plays = classesWith(spotIn(SIX_MAX_CHART, position, E), CONTINUE);
      expect(
        hands.filter((hc) => !plays.includes(hc)),
        position,
      ).toEqual([]);
      expect(hands.length, position).toBeLessThan(plays.length);
      expect(
        hands.filter((hc) => !late?.hands.has(hc)),
        position,
      ).toEqual([]);
    }

    // B1: the Rock folds K9s, which the chart calls but its BB early range leaves out, and plays the advice
    // for AJs, which is inside it.
    const b1 = routeNamed('B1');
    expect(cellOf(spotIn(SIX_MAX_CHART, 'BB', E), 'K9s').action).toBe('call');
    expect(decideRock(viewAt(b1, 'K9s'))).toEqual({ seat: 3, type: 'fold' });
    const inside = viewAt(b1, 'AJs');
    expect(decideRock(inside)).toEqual(recommendPreflop(inside).move);
    expect(decideRock(inside).type).toBe('call');

    // At 9 seats facing a UTG raise, the Rock reads its 6-max BB early spot.
    const f1 = viewAt(routeNamed('F1'), 'AJs');
    expect(chartSpotOf(f1, '6-max')).toEqual({ position: 'BB', situation: E });
    expect(decideRock(viewAt(routeNamed('F1'), 'K9s'))).toEqual({ seat: 3, type: 'fold' });
    expect(decideRock(f1)).toEqual(recommendPreflop(f1).move);
  });
});
