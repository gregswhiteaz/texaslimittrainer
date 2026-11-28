import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { chartBasisText } from '../../src/advice/explain';
import { fillTemplate, PREFLOP_CONTEXT, SITUATION_LABELS } from '../../src/advice/explanations';
import { sentencesOf } from '../../src/advice/golden';
import { comboCount, HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import {
  APPLICABLE_SPOTS,
  chartCell,
  type ChartAction,
  type ChartCell,
  type ChartSpot,
  type Position,
  type PreflopChart,
  type Situation,
} from '../../src/advice/preflop-chart';
import {
  FULL_RING_CHART,
  recommendPreflop,
  situationOf,
  SIX_MAX_CHART,
} from '../../src/advice/preflop';
import { RANK_CHARS, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { REPO_ROOT, sandboxEnv, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const RANKS = 'AKQJT98765432';
const PREMIUM = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const OPENERS: readonly Position[] = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN'];
const RE_RAISERS: readonly Position[] = [...OPENERS, 'SB', 'BB'];

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const r = (seat: SeatNumber, to: number): Step => [seat, 'raise', to];
const folds = (from: number, to: number): Step[] =>
  Array.from({ length: to - from + 1 }, (_, i) => f((from + i) as SeatNumber));

interface Route {
  name: string;
  seats: number;
  hero: SeatNumber;
  steps: Step[];
  position: Position;
  situation: Situation;
}

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
  for (const [seat, type, amount] of route.steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${route.name}: ${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, route.hero);
}

const nine = (
  name: string,
  hero: SeatNumber,
  steps: Step[],
  position: Position,
  situation: Situation,
): Route => ({ name, seats: 9, hero, steps, position, situation });

/** Spec §5 routes at 9 seats, button 1: SB 2, BB 3, UTG 4, UTG+1 5, MP 6, LJ 7, HJ 8, CO 9, BTN 1. */
const ROUTES: Route[] = [
  nine('F1', 4, [r(4, 8), r(5, 12), ...folds(6, 9), f(1), f(2), f(3)], 'UTG', 're-raise'),
  nine('F2', 5, [f(4), r(5, 8), r(6, 12), ...folds(7, 9), f(1), f(2), f(3)], 'UTG+1', 're-raise'),
  nine('F3', 6, [f(4), f(5), r(6, 8), r(7, 12), f(8), f(9), f(1), f(2), f(3)], 'MP', 're-raise'),
  nine('F4', 7, [...folds(4, 6), r(7, 8), r(8, 12), f(9), f(1), f(2), f(3)], 'LJ', 're-raise'),
  nine('F5', 8, [...folds(4, 7), r(8, 8), r(9, 12), f(1), f(2), f(3)], 'HJ', 're-raise'),
  nine('F6', 9, [...folds(4, 8), r(9, 8), r(1, 12), f(2), f(3)], 'CO', 're-raise'),
  nine('F7', 1, [...folds(4, 9), r(1, 8), r(2, 12), f(3)], 'BTN', 're-raise'),
  nine('F8', 2, [...folds(4, 9), f(1), r(2, 8), r(3, 12)], 'SB', 're-raise'),
  nine('F9', 3, [...folds(4, 9), f(1), c(2, 2), r(3, 8), r(2, 12)], 'BB', 're-raise'),
  nine('F10', 9, [r(4, 8), ...folds(5, 8), r(9, 12), f(1), f(2), f(3), r(4, 16)], 'CO', 're-raise'),
  nine(
    'F11',
    4,
    [c(4, 4), r(5, 8), r(6, 12), ...folds(7, 9), f(1), f(2), f(3)],
    'UTG',
    're-raise-not-mine',
  ),
  nine(
    'F12',
    5,
    [r(4, 8), c(5, 8), ...folds(6, 9), f(1), f(2), r(3, 12), c(4, 4)],
    'UTG+1',
    're-raise-not-mine',
  ),
  nine('F13', 6, [r(4, 8), r(5, 12)], 'MP', 're-raise-not-mine'),
  nine('F14', 7, [r(4, 8), f(5), r(6, 12)], 'LJ', 're-raise-not-mine'),
  nine('F15', 8, [f(4), r(5, 8), f(6), r(7, 12)], 'HJ', 're-raise-not-mine'),
  nine(
    'F16',
    9,
    [r(4, 8), ...folds(5, 8), c(9, 8), f(1), f(2), r(3, 12), c(4, 4)],
    'CO',
    're-raise-not-mine',
  ),
  nine('F17', 1, [...folds(4, 7), r(8, 8), r(9, 12)], 'BTN', 're-raise-not-mine'),
  nine('F18', 2, [r(4, 8), r(5, 12), ...folds(6, 9), f(1)], 'SB', 're-raise-not-mine'),
  nine('F19', 3, [r(4, 8), r(5, 12), ...folds(6, 9), f(1), f(2)], 'BB', 're-raise-not-mine'),
  {
    name: 'F22 8 seats',
    seats: 8,
    hero: 8,
    steps: [r(4, 8), r(5, 12), f(6), f(7)],
    position: 'CO',
    situation: 're-raise-not-mine',
  },
  {
    name: 'F23 10 seats',
    seats: 10,
    hero: 9,
    steps: [r(4, 8), r(5, 12), f(6), f(7), f(8)],
    position: 'HJ',
    situation: 're-raise-not-mine',
  },
  {
    name: 'F24 10 seats second UTG seat',
    seats: 10,
    hero: 5,
    steps: [c(4, 4), c(5, 4), r(6, 8), r(7, 12), ...folds(8, 10), f(1), f(2), f(3), f(4)],
    position: 'UTG',
    situation: 're-raise-not-mine',
  },
];

/** AC#6: a fourth bet before the big blind, none of the raises its own. */
const CAPPED: Route[] = [
  nine(
    'F20',
    3,
    [r(4, 8), r(5, 12), r(6, 16), ...folds(7, 9), f(1), f(2)],
    'BB',
    're-raise-not-mine',
  ),
  {
    name: 'F21 6 seats',
    seats: 6,
    hero: 3,
    steps: [r(4, 8), r(5, 12), r(6, 16), f(1), f(2)],
    position: 'BB',
    situation: 're-raise-not-mine',
  },
];

const routeNamed = (name: string) => ROUTES.find((route) => route.name === name) as Route;
const nameOf = (spot: ChartSpot) => `${spot.position} ${spot.situation}`;
const spotNamed = (name: string) =>
  FULL_RING_CHART.spots.find((s) => nameOf(s) === name) as ChartSpot;
const cellOf = (spot: ChartSpot, hc: HandClass) => spot.cells[hc] as ChartCell;
const classesWith = (spot: ChartSpot, actions: ChartAction[]): HandClass[] =>
  HAND_CLASSES.filter((hc) => actions.includes(cellOf(spot, hc).action));
const combos = (classes: Iterable<HandClass>) =>
  [...classes].reduce((sum, hc) => sum + comboCount(hc), 0);
const percent = (classes: HandClass[]) => (combos(classes) / 1326) * 100;
const wordCount = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;
const CONTINUE: ChartAction[] = ['call', 'raise'];

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

/** Q-1 problems of `P re-raise` with the given cells: C/O in [0.80, 0.90] and nothing outside the open. */
function ownShareProblems(position: Position, cells: ChartSpot['cells']) {
  const open = classesWith(spotNamed(`${position} unopened`), ['raise']);
  const cont = classesWith({ ...spotNamed(`${position} re-raise`), cells }, CONTINUE);
  const c = combos(cont);
  const o = combos(open);
  const problems: string[] = [];
  if (c < Math.ceil(0.8 * o) || c > Math.floor(0.9 * o)) {
    problems.push(`${position} re-raise: C/O ${c}/${o} outside 0.80–0.90`);
  }
  for (const hc of cont.filter((hc) => !open.includes(hc))) {
    problems.push(`${position} re-raise: ${hc} continues but is not opened`);
  }
  return { c, o, problems };
}

/** Spec §5 rule 2 for `P re-raise-not-mine` with the given cells. */
function notMineProblems(position: Position, cells: ChartSpot['cells']): string[] {
  const name = `${position} re-raise-not-mine`;
  const oneRaise = spotNamed(
    `${position} ${position === 'SB' || position === 'BB' ? 'blind-defence' : 'raise'}`,
  );
  const spot = { ...spotNamed(name), cells };
  const cont = classesWith(spot, CONTINUE);
  const problems = cont
    .filter((hc) => cellOf(oneRaise, hc).action === 'fold')
    .map((hc) => `${name}: ${hc} continues but folds in ${nameOf(oneRaise)}`);
  const parentCombos = combos(classesWith(oneRaise, CONTINUE));
  if (combos(cont) >= parentCombos) {
    problems.push(`${name}: ${combos(cont)} combos, not fewer than ${parentCombos}`);
  }
  for (const hc of classesWith(spot, ['raise'])) {
    if (!PREMIUM.has(hc)) problems.push(`${name}: ${hc} raises but is not premium`);
  }
  for (const hc of ['AA', 'KK', 'QQ']) {
    if ((cells[hc] as ChartCell).action !== 'raise') problems.push(`${name}: ${hc} does not raise`);
  }
  const width = percent(cont);
  const [low, high] = position === 'BB' ? [4, 16] : [2, 8];
  if (width < low || width > high) {
    problems.push(`${name}: continue ${width.toFixed(1)}% outside ${low}–${high}%`);
  }
  return problems;
}

function checkAllClasses(route: Route, chart: PreflopChart): void {
  for (const hc of HAND_CLASSES) {
    const view = viewAt(route, hc);
    const rec = recommendPreflop(view);
    const where = `${route.name} ${hc}`;
    expect([rec.position, rec.situation], where).toEqual([route.position, route.situation]);
    expect(situationOf(view), where).toBe(route.situation);
    expect(rec.cell, where).toEqual(chartCell(chart, route.position, route.situation, hc));
  }
}

describe('full-ring re-raise split (TASK-7.41)', () => {
  it('AC#1 full-ring re-raise routes read the own-raise or the not-my-raise spot', () => {
    for (const route of ROUTES) checkAllClasses(route, FULL_RING_CHART);

    // F10 is the fourth bet after our own raise: a raise cell is advised as a call.
    const capped = recommendPreflop(viewAt(routeNamed('F10'), 'AA'));
    expect(capped.cell.action).toBe('raise');
    expect(capped.action).toBe('call');
  });

  it(
    'AC#2 the full-ring chart has 50 spots with all 169 classes',
    () => {
      const order: (readonly [Position, Situation])[] = [
        ...[...OPENERS, 'SB' as const].map((p) => [p, 'unopened'] as const),
        ...(['UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const).map(
          (p) => [p, 'limpers'] as const,
        ),
        ...OPENERS.map((p) => [p, 'raise'] as const),
        ...OPENERS.map((p) => [p, 'raise-and-calls'] as const),
        ...RE_RAISERS.map((p) => [p, 're-raise'] as const),
        ...RE_RAISERS.map((p) => [p, 're-raise-not-mine'] as const),
        ...(['SB', 'BB'] as const).map((p) => [p, 'blind-defence'] as const),
      ];
      expect(order).toHaveLength(50);
      expect(APPLICABLE_SPOTS['full-ring'].map((s) => [s.position, s.situation])).toEqual(order);
      expect(FULL_RING_CHART.spots.map((s) => [s.position, s.situation])).toEqual(order);
      for (const spot of FULL_RING_CHART.spots) {
        expect(Object.keys(spot.cells).sort(), nameOf(spot)).toEqual([...HAND_CLASSES].sort());
      }
      for (const position of RE_RAISERS) {
        const spot = spotNamed(`${position} re-raise-not-mine`);
        expect(wordCount(spot.justification), nameOf(spot)).toBeGreaterThanOrEqual(15);
      }

      const run = spawnSync(
        process.execPath,
        ['--import', './tools/playtest/resolve-ts.js', 'tools/chart-print/main.ts', 'full-ring'],
        { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8' },
      );
      expect(run.status).toBe(0);
      expect(run.stdout.split('\n')[0]).toBe('full-ring chart: 50 spots');
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('AC#2 own-raise spots continue with the approved share of the opening range', () => {
    for (const position of [...OPENERS, 'SB' as const]) {
      const { c, o, problems } = ownShareProblems(
        position,
        spotNamed(`${position} re-raise`).cells,
      );
      console.log(`${position}: C/O = ${c}/${o} (${(c / o).toFixed(3)})`);
      expect(problems, position).toEqual([]);
    }

    const bbRaised = new Set([
      ...classesWith(spotNamed('BB limpers'), ['raise']),
      ...classesWith(spotNamed('BB blind-defence'), ['raise']),
    ]);
    const bbCont = classesWith(spotNamed('BB re-raise'), CONTINUE);
    const kept = [...bbRaised].filter((hc) => bbCont.includes(hc));
    console.log(`BB: kept ${combos(kept)}/${combos(bbRaised)} raised`);
    expect(combos(kept)).toBeGreaterThanOrEqual(Math.ceil(0.8 * combos(bbRaised)));
    const defended = classesWith(spotNamed('BB blind-defence'), CONTINUE);
    expect(bbCont.filter((hc) => !defended.includes(hc))).toEqual([]);

    for (const position of RE_RAISERS) {
      const spot = spotNamed(`${position} re-raise`);
      expect(
        classesWith(spot, ['raise']).filter((hc) => !PREMIUM.has(hc)),
        nameOf(spot),
      ).toEqual([]);
    }

    // Mutation: the base MP re-raise kept every opening hand (share 1.000), which fails the band.
    const mp = spotNamed('MP re-raise');
    const keepAll = Object.fromEntries(
      HAND_CLASSES.map((hc) => {
        const opened = cellOf(spotNamed('MP unopened'), hc).action === 'raise';
        const cell = cellOf(mp, hc);
        return [hc, opened && cell.action === 'fold' ? { ...cell, action: 'call' } : cell];
      }),
    ) as ChartSpot['cells'];
    expect(ownShareProblems('MP', keepAll).problems).toEqual([
      'MP re-raise: C/O 176/176 outside 0.80–0.90',
    ]);
  });

  it('AC#2 not-my-raise spots continue only with hands that continue against one raise', () => {
    for (const position of RE_RAISERS) {
      const spot = spotNamed(`${position} re-raise-not-mine`);
      expect(notMineProblems(position, spot.cells)).toEqual([]);
    }
    const reRaiseSpots = FULL_RING_CHART.spots.filter((s) => s.situation.startsWith('re-raise'));
    expect(reRaiseSpots).toHaveLength(18);
    expect(reRaiseSpots.flatMap(inversions)).toEqual([]);

    // Mutation: the own-raise CO grid in the not-my-raise spot breaks rule 2.
    const mutated = notMineProblems('CO', spotNamed('CO re-raise').cells);
    expect(mutated).toContain('CO re-raise-not-mine: KQo continues but folds in CO raise');
    expect(mutated.some((p) => p.includes('outside 2–8%'))).toBe(true);
  });

  it('AC#3 full-ring not-my-raise text is the approved wording', () => {
    expect(PREFLOP_CONTEXT['re-raise-not-mine']).toBe(
      'The pot has been raised more than once and none of the raises is yours, so your hand strength, {def:hand-strength}, must be very high to continue.',
    );
    expect(SITUATION_LABELS['re-raise-not-mine']).toBe(
      'facing a re-raise when you have not raised',
    );
    expect(PREFLOP_CONTEXT['re-raise']).toBe(
      'The pot has been raised more than once, so your hand strength, {def:hand-strength}, must be very high to continue.',
    );
    expect(SITUATION_LABELS['re-raise']).toBe('facing a re-raise');
    const situations = [
      'unopened',
      'limpers',
      'raise',
      'raise-and-calls',
      're-raise',
      're-raise-not-mine',
      'blind-defence',
    ];
    expect(Object.keys(PREFLOP_CONTEXT)).toEqual(situations);
    expect(Object.keys(SITUATION_LABELS)).toEqual(situations);

    const rec = recommendPreflop(viewAt(routeNamed('F13'), 'A9o'));
    expect([rec.referenceSize, rec.situation]).toEqual(['full-ring', 're-raise-not-mine']);
    expect(
      rec.explanation.startsWith(fillTemplate(PREFLOP_CONTEXT['re-raise-not-mine'], {}) + ' '),
    ).toBe(true);
    expect(sentencesOf(rec.explanation).length).toBeLessThanOrEqual(3);
    expect(chartBasisText(rec)).not.toContain(SITUATION_LABELS['re-raise-not-mine']);
  });

  it('AC#6 a not-my-raise fourth bet caps a raise cell to call', () => {
    for (const route of CAPPED) {
      const chart = route.seats === 6 ? SIX_MAX_CHART : FULL_RING_CHART;
      const view = viewAt(route, 'AA');
      const rec = recommendPreflop(view);
      expect(rec.situation, route.name).toBe('re-raise-not-mine');
      expect(view.betCount, route.name).toBe(4);
      expect(rec.cell.action, route.name).toBe('raise');
      expect(rec.action, route.name).toBe('call');
      // The big blind has 4 in and faces 16, so the call adds 12.
      expect(rec.move, route.name).toEqual({ seat: 3, type: 'call', amount: 12 });

      const raises = HAND_CLASSES.filter(
        (hc) => chartCell(chart, 'BB', 're-raise-not-mine', hc).action === 'raise',
      );
      expect(raises.length, route.name).toBeGreaterThan(0);
      for (const hc of raises) {
        expect(recommendPreflop(viewAt(route, hc)).action, `${route.name} ${hc}`).toBe('call');
      }
    }
  });
});
