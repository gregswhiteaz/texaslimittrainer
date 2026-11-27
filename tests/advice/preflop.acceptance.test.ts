import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, type HandClass } from '../../src/advice/hand-class';
import {
  APPLICABLE_SPOTS,
  ChartValidationError,
  chartCell,
  parseChart,
  type ChartAction,
  type Position,
  type Situation,
} from '../../src/advice/preflop-chart';
import { recommendPreflop, SIX_MAX_CHART } from '../../src/advice/preflop';
import { parseCards, RANK_CHARS, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { REPO_ROOT, runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Hole cards go to deck[i] and deck[i + 6]. */
const DEAL_ORDER: readonly SeatNumber[] = [2, 3, 4, 5, 6, 1];
const CHART_PATH = join(REPO_ROOT, 'src/advice/charts/six-max.json');

type Step = [SeatNumber, Action['type'], number?];
interface Script {
  position: Position;
  situation: Situation;
  hero: SeatNumber;
  steps: Step[];
}

const f = (seat: SeatNumber): Step => [seat, 'fold'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const r = (seat: SeatNumber, to: number): Step => [seat, 'raise', to];

/** One uncapped decision point per 6-max spot, in APPLICABLE_SPOTS order. */
const SCRIPTS: Script[] = [
  { position: 'UTG', situation: 'unopened', hero: 4, steps: [] },
  { position: 'HJ', situation: 'unopened', hero: 5, steps: [f(4)] },
  { position: 'CO', situation: 'unopened', hero: 6, steps: [f(4), f(5)] },
  { position: 'BTN', situation: 'unopened', hero: 1, steps: [f(4), f(5), f(6)] },
  { position: 'SB', situation: 'unopened', hero: 2, steps: [f(4), f(5), f(6), f(1)] },
  { position: 'HJ', situation: 'limpers', hero: 5, steps: [c(4, 4)] },
  { position: 'CO', situation: 'limpers', hero: 6, steps: [c(4, 4), f(5)] },
  { position: 'BTN', situation: 'limpers', hero: 1, steps: [c(4, 4), f(5), f(6)] },
  { position: 'SB', situation: 'limpers', hero: 2, steps: [c(4, 4), f(5), f(6), f(1)] },
  { position: 'BB', situation: 'limpers', hero: 3, steps: [c(4, 4), f(5), f(6), f(1), c(2, 2)] },
  {
    position: 'UTG',
    situation: 'raise',
    hero: 4,
    steps: [c(4, 4), r(5, 8), f(6), f(1), f(2), f(3)],
  },
  { position: 'HJ', situation: 'raise', hero: 5, steps: [r(4, 8)] },
  { position: 'CO', situation: 'raise', hero: 6, steps: [r(4, 8), f(5)] },
  { position: 'BTN', situation: 'raise', hero: 1, steps: [r(4, 8), f(5), f(6)] },
  {
    position: 'UTG',
    situation: 'raise-and-calls',
    hero: 4,
    steps: [c(4, 4), r(5, 8), c(6, 8), c(1, 8), f(2), f(3)],
  },
  {
    position: 'HJ',
    situation: 'raise-and-calls',
    hero: 5,
    steps: [c(4, 4), c(5, 4), r(6, 8), c(1, 8), f(2), f(3), c(4, 4)],
  },
  { position: 'CO', situation: 'raise-and-calls', hero: 6, steps: [r(4, 8), c(5, 8)] },
  { position: 'BTN', situation: 'raise-and-calls', hero: 1, steps: [r(4, 8), c(5, 8), f(6)] },
  {
    position: 'UTG',
    situation: 're-raise',
    hero: 4,
    steps: [r(4, 8), r(5, 12), f(6), f(1), f(2), f(3)],
  },
  {
    position: 'HJ',
    situation: 're-raise',
    hero: 5,
    steps: [f(4), r(5, 8), r(6, 12), f(1), f(2), f(3)],
  },
  {
    position: 'CO',
    situation: 're-raise',
    hero: 6,
    steps: [f(4), f(5), r(6, 8), r(1, 12), f(2), f(3)],
  },
  {
    position: 'BTN',
    situation: 're-raise',
    hero: 1,
    steps: [f(4), f(5), f(6), r(1, 8), r(2, 12), f(3)],
  },
  {
    position: 'SB',
    situation: 're-raise',
    hero: 2,
    steps: [f(4), f(5), f(6), f(1), r(2, 8), r(3, 12)],
  },
  {
    position: 'BB',
    situation: 're-raise',
    hero: 3,
    steps: [f(4), f(5), f(6), f(1), c(2, 2), r(3, 8), r(2, 12)],
  },
  {
    position: 'UTG',
    situation: 're-raise-not-mine',
    hero: 4,
    steps: [c(4, 4), r(5, 8), r(6, 12), f(1), f(2), f(3)],
  },
  {
    position: 'HJ',
    situation: 're-raise-not-mine',
    hero: 5,
    steps: [f(4), c(5, 4), r(6, 8), r(1, 12), f(2), f(3)],
  },
  { position: 'CO', situation: 're-raise-not-mine', hero: 6, steps: [r(4, 8), r(5, 12)] },
  { position: 'BTN', situation: 're-raise-not-mine', hero: 1, steps: [r(4, 8), r(5, 12), f(6)] },
  {
    position: 'SB',
    situation: 're-raise-not-mine',
    hero: 2,
    steps: [r(4, 8), r(5, 12), f(6), f(1)],
  },
  {
    position: 'BB',
    situation: 're-raise-not-mine',
    hero: 3,
    steps: [r(4, 8), r(5, 12), f(6), f(1), f(2)],
  },
  { position: 'SB', situation: 'blind-defence', hero: 2, steps: [f(4), f(5), f(6), r(1, 8)] },
  { position: 'BB', situation: 'blind-defence', hero: 3, steps: [r(4, 8), f(5), f(6), f(1), f(2)] },
];

/** One representative combo: pair = spade + heart, suited = spades, offsuit = spade high + heart low. */
function cardsOf(hc: HandClass): [Card, Card] {
  const high = RANK_CHARS.indexOf(hc.charAt(0));
  const low = RANK_CHARS.indexOf(hc.charAt(1));
  return [high * 4 + 3, low * 4 + (hc.endsWith('s') ? 3 : 2)];
}

/** `others` (50 cards) in order, with the hero's cards placed where the hero is dealt. */
function deckFor(hero: SeatNumber, cards: readonly [Card, Card], others?: readonly Card[]): Card[] {
  const rest = others ?? Array.from({ length: 52 }, (_, i) => i).filter((x) => !cards.includes(x));
  const deck = [...rest];
  const index = DEAL_ORDER.indexOf(hero);
  deck.splice(index, 0, cards[0]);
  deck.splice(index + 6, 0, cards[1]);
  return deck;
}

function viewAt(script: Script, deck: readonly Card[], steps = script.steps): PlayerView {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, script.hero);
}

const heroView = (script: Script, hc: HandClass) =>
  viewAt(script, deckFor(script.hero, cardsOf(hc)));

const scriptFor = (position: Position, situation: Situation) =>
  SCRIPTS.find((s) => s.position === position && s.situation === situation) as Script;

const chartData = (): { justification?: unknown; spots: Record<string, unknown>[] } =>
  JSON.parse(readFileSync(CHART_PATH, 'utf8'));

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseChart(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(ChartValidationError);
    const problems = (error as ChartValidationError).problems;
    for (const problem of problems) expect((error as Error).message).toContain(problem);
    return problems;
  }
  return [];
}

function spotOf(data: ReturnType<typeof chartData>, position: string, situation: string) {
  return data.spots.find((s) => s.position === position && s.situation === situation) as {
    grid: string[];
  };
}

function setToken(grid: string[], row: number, col: number, token: string): void {
  const tokens = (grid[row] as string).trim().split(/\s+/);
  tokens[col] = token;
  grid[row] = tokens.join(' ');
}

const classWith = (position: Position, situation: Situation, action: ChartAction) =>
  HAND_CLASSES.find((hc) => chartCell(SIX_MAX_CHART, position, situation, hc).action === action);

describe('preflop advice acceptance', () => {
  it('AC#1 every 6-max spot assigns all 169 hand classes and a missing spot is named', () => {
    expect(APPLICABLE_SPOTS['6-max']).toEqual(
      SCRIPTS.map(({ position, situation }) => ({ position, situation })),
    );
    const chart = parseChart(chartData());
    expect(chart.spots.map((s) => [s.position, s.situation])).toEqual(
      SCRIPTS.map((s) => [s.position, s.situation]),
    );
    for (const spot of chart.spots) {
      expect(Object.keys(spot.cells).sort()).toEqual([...HAND_CLASSES].sort());
      for (const cell of Object.values(spot.cells)) {
        expect(['fold', 'call', 'raise']).toContain(cell.action);
      }
    }
    for (const { position, situation } of SCRIPTS) {
      const data = chartData();
      data.spots = data.spots.filter(
        (s) => !(s.position === position && s.situation === situation),
      );
      expect(problemsOf(data)).toContain(`6-max chart: missing spot ${position} ${situation}`);
    }
  });

  it('AC#2 invalid cells and a missing justification fail naming the spot and hand class', () => {
    const cases: [string, string][] = [
      ['-', '6-max chart: CO unopened A9s has no action'],
      ['X', '6-max chart: CO unopened A9s has invalid action "X" (use F, C or R)'],
      ['R/C/F', '6-max chart: CO unopened A9s has more than one acceptable alternative'],
    ];
    for (const [token, problem] of cases) {
      const data = chartData();
      setToken(spotOf(data, 'CO', 'unopened').grid, 0, 5, token);
      expect(problemsOf(data)).toContain(problem);
    }

    const shortRow = chartData();
    const grid = spotOf(shortRow, 'BTN', 'raise').grid;
    grid[12] = (grid[12] as string).trim().split(/\s+/).slice(0, 12).join(' ');
    expect(problemsOf(shortRow)).toContain('6-max chart: BTN raise 22 has no action');

    const missing = '6-max chart: missing plain-English justification (at least 50 words)';
    const deleted = chartData();
    delete deleted.justification;
    expect(problemsOf(deleted)).toContain(missing);
    const empty = chartData();
    empty.justification = '';
    expect(problemsOf(empty)).toContain(missing);
  });

  it('AC#3 advice follows an edited chart cell without code changes', () => {
    const script = scriptFor('CO', 'unopened');
    const view = viewAt(script, deckFor(6, parseCards('As 9d') as [Card, Card]));
    const original = chartCell(SIX_MAX_CHART, 'CO', 'unopened', 'A9o').action;
    expect(recommendPreflop(view).action).toBe(original);

    const data = JSON.parse(readFileSync(CHART_PATH, 'utf8'));
    const edited = original === 'fold' ? 'raise' : 'fold';
    setToken(spotOf(data, 'CO', 'unopened').grid, 5, 0, edited === 'fold' ? 'F' : 'R');
    const result = recommendPreflop(view, { chart: parseChart(data) });
    expect(result.handClass).toBe('A9o');
    expect(result.action).toBe(edited);

    const dir = join(REPO_ROOT, 'src/advice');
    const sources = readdirSync(dir).filter((name) => name.endsWith('.ts'));
    expect(sources).toEqual(
      expect.arrayContaining(['hand-class.ts', 'preflop-chart.ts', 'preflop.ts']),
    );
    for (const name of sources) {
      const text = readFileSync(join(dir, name), 'utf8');
      expect(text, name).not.toMatch(/['"`][2-9TJQKA]{2}[so]?['"`]/);
    }
  });

  it('AC#4 returns the chart cell, borderline flag, alternative, position and situation', () => {
    for (const script of SCRIPTS) {
      for (const hc of HAND_CLASSES) {
        const view = heroView(script, hc);
        const result = recommendPreflop(view);
        const cell = chartCell(SIX_MAX_CHART, script.position, script.situation, hc);
        const freeCheck = script.position === 'BB' && script.situation === 'limpers';
        const adjust = (a: ChartAction) => (freeCheck && a !== 'raise' ? 'check' : a);
        const alternative = cell.alternative === null ? null : adjust(cell.alternative);
        expect(result).toMatchObject({
          basis: 'chart',
          referenceSize: '6-max',
          position: script.position,
          situation: script.situation,
          handClass: hc,
          borderline: cell.borderline,
          action: adjust(cell.action),
          alternative: alternative === adjust(cell.action) ? null : alternative,
        });
        expect(result.cell).toEqual(cell);
        expect(result.move.type).toBe(result.action);
        expect(view.legalActions).toContainEqual(result.move);
      }
    }
  });

  it("AC#5 other players' and undealt cards never change the recommendation", () => {
    const hero = parseCards('As Ad') as [Card, Card];
    const others = Array.from({ length: 52 }, (_, i) => i).filter((x) => !hero.includes(x));
    fc.assert(
      fc.property(
        fc.constantFrom(...SCRIPTS),
        fc.shuffledSubarray(others, { minLength: 50, maxLength: 50 }),
        (script, permuted) => {
          const base = recommendPreflop(viewAt(script, deckFor(script.hero, hero)));
          const shuffled = recommendPreflop(viewAt(script, deckFor(script.hero, hero, permuted)));
          expect(shuffled).toStrictEqual(base);
        },
      ),
      { numRuns: 200 },
    );
    const script = scriptFor('UTG', 'unopened');
    const aces = recommendPreflop(viewAt(script, deckFor(4, hero)));
    const junk = recommendPreflop(viewAt(script, deckFor(4, parseCards('7c 2d') as [Card, Card])));
    expect(aces.handClass).toBe('AA');
    expect(junk.handClass).toBe('72o');
  });

  it(
    'AC#6 passing HandState to the advice API fails typecheck',
    () => {
      const files: Record<string, string> = {};
      for (const path of [
        'src/engine/cards.ts',
        'src/engine/hand.ts',
        'src/engine/hand-evaluator.ts',
        'src/engine/player-view.ts',
        'src/advice/hand-class.ts',
        'src/advice/preflop-chart.ts',
        'src/advice/preflop.ts',
        'src/advice/charts/six-max.json',
        'src/advice/charts/heads-up.json',
        'src/advice/charts/full-ring.json',
        'src/advice/explain.ts',
        'src/advice/explanations.ts',
        'src/advice/postflop.ts',
        'src/advice/equity.ts',
        'src/advice/ranges.ts',
        'src/advice/ranges/six-max.json',
        'src/advice/recommend.ts',
        'src/engine/seeded-random.ts',
        'src/advice/ranges/hand-order.json',
        'src/advice/ranges/heads-up.json',
        'src/advice/ranges/full-ring.json',
      ]) {
        files[path] = readFileSync(join(REPO_ROOT, path), 'utf8');
      }
      const probe = (call: string) =>
        [
          "import type { HandState } from '../engine/hand';",
          "import { playerView } from '../engine/player-view';",
          "import { recommendPreflop } from './preflop';",
          '',
          'declare const state: HandState;',
          `export const advice = ${call};`,
          'export const unused: typeof playerView | null = null;',
          '',
        ].join('\n');

      const broken = runInSandbox(
        { ...files, 'src/advice/probe.ts': probe('recommendPreflop(state)') },
        'typecheck',
      );
      expect(broken.exitCode, broken.output).not.toBe(0);
      const errors = [
        ...broken.output.matchAll(/src\/advice\/probe\.ts\((\d+),\d+\): error TS2345/g),
      ];
      expect(
        errors.map((m) => Number(m[1])),
        broken.output,
      ).toEqual([6]);
      expect(broken.output).toContain('PlayerView');

      const control = runInSandbox(
        { ...files, 'src/advice/probe.ts': probe('recommendPreflop(playerView(state, 4))') },
        'typecheck',
      );
      expect(control.exitCode, control.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('AC#7 a fourth bet uses the re-raise cell and caps raise to call', () => {
    const raiseClass = classWith('UTG', 're-raise', 'raise');
    const foldClass = classWith('UTG', 're-raise', 'fold');
    expect(raiseClass).toBeDefined();
    expect(foldClass).toBeDefined();
    const script = scriptFor('UTG', 're-raise');
    const capped: Step[] = [r(4, 8), f(5), r(6, 12), f(1), f(2), r(3, 16)];

    const view = viewAt(script, deckFor(4, cardsOf(raiseClass as string)), capped);
    expect(view.betCount).toBe(4);
    const result = recommendPreflop(view);
    expect(result.situation).toBe('re-raise');
    expect(result.cell.action).toBe('raise');
    expect(result.action).toBe('call');
    expect(result.move).toEqual({ seat: 4, type: 'call', amount: 8 });

    const folded = recommendPreflop(
      viewAt(script, deckFor(4, cardsOf(foldClass as string)), capped),
    );
    expect(folded.action).toBe('fold');

    const uncapped = heroView(script, raiseClass as string);
    expect(uncapped.betCount).toBe(3);
    expect(recommendPreflop(uncapped).action).toBe('raise');
  });

  it('AC#8 the big blind facing limpers checks where the chart says call', () => {
    const callClass = classWith('BB', 'limpers', 'call');
    const raiseClass = classWith('BB', 'limpers', 'raise');
    expect(callClass).toBeDefined();
    expect(raiseClass).toBeDefined();
    const script = scriptFor('BB', 'limpers');

    const result = recommendPreflop(heroView(script, callClass as string));
    expect(result.situation).toBe('limpers');
    expect(result.cell.action).toBe('call');
    expect(result.action).toBe('check');
    expect(result.move).toEqual({ seat: 3, type: 'check' });

    const raised = recommendPreflop(heroView(script, raiseClass as string));
    expect(raised.action).toBe('raise');
    expect(raised.move).toEqual({ seat: 3, type: 'raise', amount: 8 });
  });
});
