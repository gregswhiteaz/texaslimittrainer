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
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { runPlaytest } from '../../src/playtest/runner';
import { REPO_ROOT, sandboxEnv, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const PREMIUM = new Set(['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs']);
const SIX_MAX_POSITIONS: readonly Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const r = (seat: SeatNumber, to: number): Step => [seat, 'raise', to];

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

const six = (
  name: string,
  hero: SeatNumber,
  steps: Step[],
  position: Position,
  situation: Situation,
): Route => ({ name, seats: 6, hero, steps, position, situation });

/** Spec §5 A-2 routes at 6 seats, button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. */
const ROUTES: Route[] = [
  six('R1', 4, [r(4, 8), r(5, 12), f(6), f(1), f(2), f(3)], 'UTG', 're-raise'),
  six('R2', 6, [r(4, 8), r(5, 12)], 'CO', 're-raise-not-mine'),
  six('R3', 6, [r(4, 8), f(5), c(6, 8), f(1), f(2), r(3, 12), c(4, 4)], 'CO', 're-raise-not-mine'),
  six('R4', 4, [c(4, 4), r(5, 8), r(6, 12), f(1), f(2), f(3)], 'UTG', 're-raise-not-mine'),
  six('R5', 6, [r(4, 8), f(5), r(6, 12), f(1), f(2), f(3), r(4, 16)], 'CO', 're-raise'),
  six('R6', 2, [r(4, 8), r(5, 12), f(6), f(1)], 'SB', 're-raise-not-mine'),
  six('R7', 3, [r(4, 8), r(5, 12), f(6), f(1), f(2)], 'BB', 're-raise-not-mine'),
  six('R8', 2, [f(4), f(5), f(6), f(1), r(2, 8), r(3, 12)], 'SB', 're-raise'),
  six('R9', 3, [f(4), f(5), f(6), f(1), c(2, 2), r(3, 8), r(2, 12)], 'BB', 're-raise'),
  six('R10', 2, [f(4), f(5), r(6, 8), r(1, 12)], 'SB', 're-raise-not-mine'),
  six('R11', 1, [f(4), f(5), f(6), r(1, 8), r(2, 12), f(3)], 'BTN', 're-raise'),
  six('R12', 5, [f(4), r(5, 8), r(6, 12), f(1), f(2), f(3)], 'HJ', 're-raise'),
  {
    name: '3 seats cold',
    seats: 3,
    hero: 3,
    steps: [r(1, 8), r(2, 12)],
    position: 'BB',
    situation: 're-raise-not-mine',
  },
  {
    name: '7 seats cold',
    seats: 7,
    hero: 6,
    steps: [r(4, 8), r(5, 12)],
    position: 'HJ',
    situation: 're-raise-not-mine',
  },
];

const nameOf = (spot: ChartSpot) => `${spot.position} ${spot.situation}`;
const spotNamed = (name: string) =>
  SIX_MAX_CHART.spots.find((s) => nameOf(s) === name) as ChartSpot;
const classesWith = (spot: ChartSpot, actions: ChartAction[]): HandClass[] =>
  HAND_CLASSES.filter((hc) => actions.includes((spot.cells[hc] as ChartCell).action));
const percent = (classes: HandClass[]) =>
  (classes.reduce((sum, hc) => sum + comboCount(hc), 0) / 1326) * 100;
const wordCount = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;
const CONTINUE: ChartAction[] = ['call', 'raise'];

/** Spec §5 authoring rules 1–3 for `P re-raise-not-mine` with the given cells. */
function notMineProblems(position: Position, cells: ChartSpot['cells']): string[] {
  const name = `${position} re-raise-not-mine`;
  const oneRaise = spotNamed(
    `${position} ${position === 'SB' || position === 'BB' ? 'blind-defence' : 'raise'}`,
  );
  const spot = { ...spotNamed(name), cells };
  const problems = classesWith(spot, CONTINUE)
    .filter((hc) => (oneRaise.cells[hc] as ChartCell).action === 'fold')
    .map((hc) => `${name}: ${hc} continues but folds in ${nameOf(oneRaise)}`);
  for (const hc of classesWith(spot, ['raise'])) {
    if (!PREMIUM.has(hc)) problems.push(`${name}: ${hc} raises but is not premium`);
  }
  for (const hc of ['AA', 'KK', 'QQ']) {
    if ((cells[hc] as ChartCell).action !== 'raise') problems.push(`${name}: ${hc} does not raise`);
  }
  const width = percent(classesWith(spot, CONTINUE));
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

describe('6-max re-raise split (TASK-7.40)', () => {
  it('AC#1 6-max re-raise routes read the own-raise or the not-my-raise spot', () => {
    for (const route of ROUTES) checkAllClasses(route, SIX_MAX_CHART);

    // R5 is the fourth bet: a raise cell is advised as a call.
    const r5 = ROUTES.find((route) => route.name === 'R5') as Route;
    const capped = recommendPreflop(viewAt(r5, 'AA'));
    expect(capped.cell.action).toBe('raise');
    expect(capped.action).toBe('call');
  });

  it(
    'AC#2 the 6-max chart has 32 spots with all 169 classes',
    () => {
      const order: (readonly [Position, Situation])[] = [
        ...(['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const).map((p) => [p, 'unopened'] as const),
        ...(['HJ', 'CO', 'BTN', 'SB', 'BB'] as const).map((p) => [p, 'limpers'] as const),
        ...(['UTG', 'HJ', 'CO', 'BTN'] as const).map((p) => [p, 'raise'] as const),
        ...(['UTG', 'HJ', 'CO', 'BTN'] as const).map((p) => [p, 'raise-and-calls'] as const),
        ...SIX_MAX_POSITIONS.map((p) => [p, 're-raise'] as const),
        ...SIX_MAX_POSITIONS.map((p) => [p, 're-raise-not-mine'] as const),
        ...(['SB', 'BB'] as const).map((p) => [p, 'blind-defence-early'] as const),
        ...(['SB', 'BB'] as const).map((p) => [p, 'blind-defence'] as const),
      ];
      expect(order).toHaveLength(34);
      expect(APPLICABLE_SPOTS['6-max'].map((s) => [s.position, s.situation])).toEqual(order);
      expect(SIX_MAX_CHART.spots.map((s) => [s.position, s.situation])).toEqual(order);
      for (const spot of SIX_MAX_CHART.spots) {
        expect(Object.keys(spot.cells).sort(), nameOf(spot)).toEqual([...HAND_CLASSES].sort());
      }
      for (const position of SIX_MAX_POSITIONS) {
        const spot = spotNamed(`${position} re-raise-not-mine`);
        expect(wordCount(spot.justification), nameOf(spot)).toBeGreaterThanOrEqual(15);
      }

      const run = spawnSync(
        process.execPath,
        ['--import', './tools/playtest/resolve-ts.js', 'tools/chart-print/main.ts', '6-max'],
        { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8' },
      );
      expect(run.status).toBe(0);
      expect(run.stdout.split('\n')[0]).toBe('6-max chart: 34 spots');
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('AC#2 AC#3 not-my-raise spots continue only with hands that continue against one raise', () => {
    for (const position of SIX_MAX_POSITIONS) {
      const spot = spotNamed(`${position} re-raise-not-mine`);
      expect(notMineProblems(position, spot.cells)).toEqual([]);
    }

    const co = spotNamed('CO re-raise-not-mine');
    expect((co.cells['A9o'] as ChartCell).action).toBe('fold');
    expect((co.cells['A8o'] as ChartCell).action).toBe('fold');

    // Mutation: today's own-raise CO grid in the not-my-raise spot breaks rule 1.
    const mutated = notMineProblems('CO', spotNamed('CO re-raise').cells);
    expect(mutated).toContain('CO re-raise-not-mine: KTo continues but folds in CO raise');
    expect(mutated).toContain('CO re-raise-not-mine: A7s continues but folds in CO raise');
  });

  it('AC#4 the not-my-raise context sentence and label use the approved wording', () => {
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

    const r2 = ROUTES.find((route) => route.name === 'R2') as Route;
    const rec = recommendPreflop(viewAt(r2, 'A9o'));
    expect(rec.situation).toBe('re-raise-not-mine');
    expect(
      rec.explanation.startsWith(fillTemplate(PREFLOP_CONTEXT['re-raise-not-mine'], {}) + ' '),
    ).toBe(true);
    expect(sentencesOf(rec.explanation).length).toBeLessThanOrEqual(3);
    expect(chartBasisText(rec)).not.toContain(SITUATION_LABELS['re-raise-not-mine']);
  });

  it('AC#6 heads-up advice is unchanged and full ring reads the split (re-pinned by TASK-7.41)', () => {
    // Button 1 at 9 seats: SB 2, BB 3, UTG 4, UTG+1 5, MP 6, LJ 7, HJ 8, CO 9, BTN 1.
    const nine: Route[] = [
      {
        name: '9 seats cold',
        seats: 9,
        hero: 1,
        steps: [r(4, 8), f(5), f(6), f(7), f(8), r(9, 12)],
        position: 'BTN',
        situation: 're-raise-not-mine',
      },
      {
        name: '9 seats called then re-raised',
        seats: 9,
        hero: 9,
        steps: [r(4, 8), f(5), f(6), f(7), f(8), c(9, 8), f(1), f(2), r(3, 12), c(4, 4)],
        position: 'CO',
        situation: 're-raise-not-mine',
      },
    ];
    const context = fillTemplate(PREFLOP_CONTEXT['re-raise-not-mine'], {});
    for (const route of nine) {
      checkAllClasses(route, FULL_RING_CHART);
      for (const hc of HAND_CLASSES) {
        expect(recommendPreflop(viewAt(route, hc)).explanation.startsWith(context + ' ')).toBe(
          true,
        );
      }
    }

    for (const size of [2, 9]) {
      const seen = new Set<Situation>();
      const summary = runPlaytest({ hands: 300, seed: 740 + size, size }, undefined, {
        makePolicy: (code, seat) => {
          const random = randomMovePolicy(seatGenerator(code, seat));
          return (view) => {
            if (view.street === 'preflop') seen.add(situationOf(view));
            return random(view);
          };
        },
      });
      expect(summary.violations).toBe(0);
      expect(seen.has('re-raise'), `${size} seats`).toBe(true);
      expect(seen.has('re-raise-not-mine'), `${size} seats`).toBe(size === 9);
    }

    expect(APPLICABLE_SPOTS['heads-up']).toHaveLength(6);
    expect(APPLICABLE_SPOTS['full-ring']).toHaveLength(52);
    for (const size of ['heads-up', 'full-ring'] as const) {
      expect(APPLICABLE_SPOTS[size].some((s) => s.situation === 're-raise-not-mine')).toBe(
        size === 'full-ring',
      );
    }
  });
});
