import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, handClassOf, type HandClass } from '../../src/advice/hand-class';
import { SIX_MAX_CHART, positionOf, situationOf } from '../../src/advice/preflop';
import {
  APPLICABLE_SPOTS,
  chartCell,
  parseChart,
  type Position,
  type PreflopChart,
  type Situation,
} from '../../src/advice/preflop-chart';
import { recommend } from '../../src/advice/recommend';
import { ROCK_STYLE, decideRock } from '../../src/bots/rock';
import {
  StyleValidationError,
  parseStyle,
  startingRangeFor,
  type RangeSpot,
} from '../../src/bots/style';
import { decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { parseCard, type Card } from '../../src/engine/cards';
import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import rock from '../../src/bots/styles/rock.json' with { type: 'json' };
import sixMax from '../../src/advice/charts/six-max.json' with { type: 'json' };

const TEST_TIMEOUT_MS = 120_000;
const SEAT = 1;
const SPOTS = APPLICABLE_SPOTS['6-max'];
const MAX_SEED = 4294967295;

const words = (text: string): number => (text.match(/\p{L}+/gu) ?? []).length;
const key = (position: Position, situation: Situation): string => `${position} ${situation}`;

interface RawSpot {
  position: string;
  situation: string;
  hands: string;
  justification: string;
}
interface RawRock {
  description?: string;
  startingRange?: RawSpot[];
  [field: string]: unknown;
}
const raw = (): RawRock => structuredClone(rock) as RawRock;
const rawSpot = (file: RawRock, position: Position, situation: Situation): RawSpot =>
  file.startingRange?.find((s) => s.position === position && s.situation === situation) as RawSpot;

function problemsOf(input: unknown, chart?: PreflopChart): readonly string[] {
  try {
    parseStyle(input, 'rock.json', chart);
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    return (error as StyleValidationError).problems;
  }
  throw new Error('expected a StyleValidationError');
}

function owed(view: PlayerView): number {
  const hero = view.players.find((p) => p.seat === view.seat);
  if (hero === undefined) throw new Error('hero missing');
  return view.currentBet - hero.streetContribution;
}

function legal(view: PlayerView, type: Action['type']): Action {
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`no legal ${type}`);
  return move;
}

/** The TAG chart's non-fold classes in the spot (A-2). */
const tagPlays = (position: Position, situation: Situation): HandClass[] =>
  HAND_CLASSES.filter((hc) => chartCell(SIX_MAX_CHART, position, situation, hc).action !== 'fold');

const rangeOf = (position: Position, situation: Situation): RangeSpot => {
  const spot = startingRangeFor(ROCK_STYLE, position, situation);
  if (spot === undefined) throw new Error(`no range for ${key(position, situation)}`);
  return spot;
};

/** Cards of the class: pair `<r>c <r>d`, suited `<h>s <l>s`, offsuit `<h>s <l>h`. */
function cardsOf(hc: HandClass): [Card, Card] {
  const [high, low] = [hc.charAt(0), hc.charAt(1)];
  if (hc.length === 2) return [parseCard(`${high}c`), parseCard(`${low}d`)];
  return [parseCard(`${high}s`), parseCard(`${low}${hc.endsWith('s') ? 's' : 'h'}`)];
}
const substitute = (view: PlayerView, hc: HandClass): PlayerView => ({
  ...view,
  holeCards: cardsOf(hc),
});

const spotKeyOf = (view: PlayerView): string => key(positionOf(view), situationOf(view));

/** A-6: seat 1's preflop views from 1,000 random-move hands, seed 65. Collected once. */
let collected: PlayerView[] | undefined;
function views(): PlayerView[] {
  if (collected !== undefined) return collected;
  const seen: PlayerView[] = [];
  const summary = runPlaytest({ hands: 1000, seed: 65, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      const policy = randomMovePolicy(seatGenerator(code, seat));
      if (seat !== SEAT) return policy;
      return (view) => {
        if (view.street === 'preflop') seen.push(view);
        return policy(view);
      };
    },
  });
  expect(summary.violations).toBe(0);
  collected = seen;
  return collected;
}

/** The first recorded view of each spot, keyed "<position> <situation>". */
function firstViews(): Map<string, PlayerView> {
  const first = new Map<string, PlayerView>();
  for (const view of views()) {
    const k = spotKeyOf(view);
    if (!first.has(k)) first.set(k, view);
  }
  return first;
}

const exampleA = (): PlayerView => views()[1] as PlayerView;
const exampleB = (): PlayerView => views()[141] as PlayerView;
const exampleC = (): PlayerView => views()[79] as PlayerView;
const exampleD = (): PlayerView => views()[70] as PlayerView;

const COUNTS: readonly number[] = [
  ...[15, 20, 29, 45, 25],
  ...[13, 18, 23, 14, 12],
  ...[7, 13, 16, 21],
  ...[7, 8, 13, 16],
  ...[5, 5, 6, 7, 5, 6],
  ...[5, 5, 5, 5, 5, 5],
  ...[17, 41],
];

describe('Rock (very tight) bot', () => {
  it('the Rock style file holds a starting range for every position and situation and a description', () => {
    expect(ROCK_STYLE.style).toBe('Rock');
    expect(words(ROCK_STYLE.description)).toBeGreaterThanOrEqual(15);
    expect(ROCK_STYLE.mixedSpots.size).toBe(0);
    expect(ROCK_STYLE.deviations).toEqual([]);
    const range = ROCK_STYLE.startingRange ?? [];
    expect(range).toHaveLength(32);
    expect(range.map((s) => key(s.position, s.situation))).toEqual(
      SPOTS.map((s) => key(s.position, s.situation)),
    );
    expect(range.map((s) => s.hands.size)).toEqual(COUNTS);
    for (const spot of range) expect(words(spot.justification)).toBeGreaterThanOrEqual(10);
    expect(rangeOf('UTG', 'unopened').hands.size).toBe(15);
    expect(rangeOf('BB', 'limpers').hands.size).toBe(12);
    expect(rangeOf('UTG', 're-raise').hands.size).toBe(5);
    expect(rangeOf('BB', 'blind-defence').hands.size).toBe(41);
    expect(parseStyle(raw(), 'rock.json')).toEqual(ROCK_STYLE);

    const noDescription = raw();
    delete noDescription.description;
    expect(problemsOf(noDescription)).toContain(
      'rock.json: style has no plain-English description (at least 15 words)',
    );
    const noRange = raw();
    delete noRange.startingRange;
    expect(problemsOf(noRange)).toEqual(['rock.json: style Rock has no starting range']);
    const noSpot = raw();
    noSpot.startingRange = noSpot.startingRange?.filter(
      (s) => !(s.position === 'BB' && s.situation === 're-raise'),
    );
    expect(problemsOf(noSpot)).toEqual([
      'rock.json: style Rock starting range is missing spot BB re-raise',
    ]);
  });

  it('every Rock range class is a TAG non-fold cell and each range is narrower', () => {
    expect(() => parseStyle(raw(), 'rock.json', SIX_MAX_CHART)).not.toThrow();
    const range = ROCK_STYLE.startingRange ?? [];
    for (const spot of range) {
      const plays = tagPlays(spot.position, spot.situation);
      for (const hc of spot.hands) {
        expect(chartCell(SIX_MAX_CHART, spot.position, spot.situation, hc).action).not.toBe('fold');
      }
      expect(spot.hands.size).toBeLessThan(plays.length);
    }
    const unions: [Position, number, number][] = [];
    for (const position of ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const) {
      const spots = range.filter((s) => s.position === position);
      const rockUnion = new Set(spots.flatMap((s) => [...s.hands]));
      const tagUnion = new Set(spots.flatMap((s) => tagPlays(s.position, s.situation)));
      unions.push([position, rockUnion.size, tagUnion.size]);
    }
    expect(unions).toEqual([
      ['UTG', 15, 39],
      ['HJ', 20, 46],
      ['CO', 29, 57],
      ['BTN', 45, 82],
      ['SB', 25, 79],
      ['BB', 41, 169],
    ]);

    const folded = raw();
    rawSpot(folded, 'UTG', 'unopened').hands += ' 72o';
    expect(problemsOf(folded)).toEqual([
      'rock.json: style Rock starting range UTG unopened has 72o, which the TAG chart folds',
    ]);

    const wide = raw();
    rawSpot(wide, 'BB', 're-raise').hands = tagPlays('BB', 're-raise').join(' ');
    expect(problemsOf(wide)).toEqual([
      "rock.json: style Rock starting range BB re-raise has 22 hand classes, not fewer than the TAG chart's 22",
    ]);

    const union = raw();
    for (const { position, situation } of SPOTS.filter((s) => s.position === 'UTG')) {
      const drop = situation === 'unopened' ? '55' : 'AA';
      rawSpot(union, position, situation).hands = tagPlays(position, situation)
        .filter((hc) => hc !== drop)
        .join(' ');
    }
    expect(problemsOf(union)).toEqual([
      "rock.json: style Rock starting range for UTG has 39 hand classes, not fewer than the TAG chart's 39",
    ]);

    const chartFile = structuredClone(sixMax) as {
      spots: { position: string; situation: string; grid: string[] }[];
    };
    const utgRaise = chartFile.spots.find((s) => s.position === 'UTG' && s.situation === 'raise');
    if (utgRaise === undefined) throw new Error('no UTG raise spot');
    expect(utgRaise.grid[0]?.charAt(0)).toBe('R');
    utgRaise.grid[0] = 'F' + (utgRaise.grid[0] as string).slice(1);
    const chart = parseChart(chartFile);
    expect(chartCell(chart, 'UTG', 'raise', 'AA').action).toBe('fold');
    expect(problemsOf(raw(), chart)).toEqual([
      'rock.json: style Rock starting range UTG raise has AA, which the TAG chart folds',
    ]);
  });

  it(
    'facing a bet preflop the Rock folds every hand class outside its range under any replay code',
    () => {
      const all = views();
      expect(all).toHaveLength(1464);
      const facing = all.filter((v) => owed(v) > 0);
      const natural = facing.filter(
        (v) => !rangeOf(positionOf(v), situationOf(v)).hands.has(handClassOf(v.holeCards)),
      );
      expect(natural.length).toBeGreaterThan(0);
      for (const view of natural) expect(decideRock(view)).toEqual(legal(view, 'fold'));

      const first = firstViews();
      const spots = SPOTS.filter((s) => !(s.position === 'BB' && s.situation === 'limpers'));
      expect(spots).toHaveLength(31);
      for (const { position, situation } of spots) {
        const view = first.get(key(position, situation));
        if (view === undefined) throw new Error(`no view for ${key(position, situation)}`);
        expect(owed(view)).toBeGreaterThan(0);
        const fold = legal(view, 'fold');
        const seeds = [
          0,
          MAX_SEED,
          ...[1, 2, 3].map((k) => botDecisionSeed(handReplayCode(6501, k), view)),
        ];
        const range = rangeOf(position, situation).hands;
        let tagPlaysOne = false;
        for (const hc of HAND_CLASSES.filter((c) => !range.has(c))) {
          const sub = substitute(view, hc);
          expect(decideRock(sub)).toEqual(fold);
          for (const seed of seeds) {
            expect(
              handleAdviceRequest({ id: 1, kind: 'bot', view: sub, style: 'Rock', seed }),
            ).toEqual({ id: 1, ok: true, value: { seat: SEAT, type: 'fold' } });
          }
          if (
            chartCell(SIX_MAX_CHART, position, situation, hc).action !== 'fold' &&
            decideTag(sub).type !== 'fold'
          ) {
            tagPlaysOne = true;
          }
        }
        expect(tagPlaysOne).toBe(true);
      }

      // Example A: BTN re-raise, QTo, owing 4. TAG calls; the Rock folds.
      const a = exampleA();
      expect(handClassOf(a.holeCards)).toBe('QTo');
      expect(spotKeyOf(a)).toBe('BTN re-raise');
      expect([a.button, a.currentBet, a.betCount, owed(a)]).toEqual([1, 16, 4, 4]);
      expect(chartCell(SIX_MAX_CHART, 'BTN', 're-raise', 'QTo').action).toBe('call');
      expect(decideRock(a)).toEqual({ seat: SEAT, type: 'fold' });
      expect(decideTag(a)).toEqual({ seat: SEAT, type: 'call', amount: 4 });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'in the big blind with no raise to face the Rock checks hands outside its range',
    () => {
      const limped = views().filter((v) => spotKeyOf(v) === 'BB limpers');
      expect(limped.length).toBeGreaterThan(0);
      const range = rangeOf('BB', 'limpers').hands;
      const outside = HAND_CLASSES.filter((hc) => !range.has(hc));
      expect(outside).toHaveLength(157);
      for (const view of limped) {
        expect(owed(view)).toBe(0);
        const check = legal(view, 'check');
        for (const hc of outside) expect(decideRock(substitute(view, hc))).toEqual(check);
      }
      const sample = limped[0] as PlayerView;
      for (const hc of outside) {
        for (const seed of [0, MAX_SEED]) {
          expect(
            handleAdviceRequest({
              id: 2,
              kind: 'bot',
              view: substitute(sample, hc),
              style: 'Rock',
              seed,
            }),
          ).toEqual({ id: 2, ok: true, value: legal(sample, 'check') });
        }
      }

      // Example B: BB limpers, QJs, nothing owed. TAG raises to 8; the Rock checks.
      const b = exampleB();
      expect(handClassOf(b.holeCards)).toBe('QJs');
      expect(spotKeyOf(b)).toBe('BB limpers');
      expect([b.button, b.currentBet, b.betCount, owed(b)]).toEqual([5, 4, 1, 0]);
      expect(decideTag(b)).toEqual({ seat: SEAT, type: 'raise', amount: 8 });
      expect(decideRock(b)).toEqual({ seat: SEAT, type: 'check' });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'removing a hand class from the Rock file makes the Rock fold it',
    () => {
      // Example C: UTG unopened, AQo in range, so the Rock plays the advice raise like TAG.
      const c = exampleC();
      expect(handClassOf(c.holeCards)).toBe('AQo');
      expect(spotKeyOf(c)).toBe('UTG unopened');
      expect([c.button, c.currentBet, c.betCount, owed(c)]).toEqual([4, 4, 1, 4]);
      expect(decideRock(c)).toEqual({ seat: SEAT, type: 'raise', amount: 8 });
      expect(decideTag(c)).toEqual({ seat: SEAT, type: 'raise', amount: 8 });

      // Example D: BB blind-defence, A2s, a call cell: the Rock calls.
      const d = exampleD();
      expect(handClassOf(d.holeCards)).toBe('A2s');
      expect(spotKeyOf(d)).toBe('BB blind-defence');
      expect([d.currentBet, d.betCount, owed(d)]).toEqual([8, 2, 4]);
      expect(chartCell(SIX_MAX_CHART, 'BB', 'blind-defence', 'A2s').action).toBe('call');
      expect(decideRock(d)).toEqual({ seat: SEAT, type: 'call', amount: 4 });

      // Example E: the file without AQo in UTG unopened parses, and the Rock folds AQo there.
      const file = raw();
      const utg = rawSpot(file, 'UTG', 'unopened');
      utg.hands = utg.hands
        .split(' ')
        .filter((hc) => hc !== 'AQo')
        .join(' ');
      const modified = parseStyle(file, 'rock.json');
      expect(startingRangeFor(modified, 'UTG', 'unopened')?.hands.size).toBe(14);
      expect(decideRock(c, { style: modified })).toEqual({ seat: SEAT, type: 'fold' });
      expect(decideRock(c)).toEqual({ seat: SEAT, type: 'raise', amount: 8 });

      // Every in-range class of every spot with a bet owed: the shipped style plays the advice (never fold),
      // and a copy without just that class in just that spot folds it.
      const first = firstViews();
      let checked = 0;
      for (const spot of ROCK_STYLE.startingRange ?? []) {
        const view = first.get(key(spot.position, spot.situation));
        if (view === undefined)
          throw new Error(`no view for ${key(spot.position, spot.situation)}`);
        if (owed(view) === 0) continue;
        for (const hc of spot.hands) {
          const sub = substitute(view, hc);
          const action = decideRock(sub);
          expect(action.type).not.toBe('fold');
          expect(action).toEqual(recommend(sub).move);
          const edited = raw();
          const target = rawSpot(edited, spot.position, spot.situation);
          target.hands = target.hands
            .split(/\s+/)
            .filter((c) => c !== hc)
            .join(' ');
          const without = parseStyle(edited, 'rock.json');
          expect(startingRangeFor(without, spot.position, spot.situation)?.hands.size).toBe(
            spot.hands.size - 1,
          );
          expect(decideRock(sub, { style: without })).toEqual(legal(sub, 'fold'));
          checked++;
        }
      }
      expect(checked).toBe(COUNTS.reduce((sum, n) => sum + n, 0) - 12);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'a Rock seat in the worker plays the Rock decision',
    () => {
      const a = exampleA();
      const b = exampleB();
      expect(handleAdviceRequest({ id: 3, kind: 'bot', view: a, style: 'Rock', seed: 0 })).toEqual({
        id: 3,
        ok: true,
        value: { seat: SEAT, type: 'fold' },
      });
      expect(handleAdviceRequest({ id: 3, kind: 'bot', view: b, style: 'Rock', seed: 0 })).toEqual({
        id: 3,
        ok: true,
        value: { seat: SEAT, type: 'check' },
      });
      for (const view of [a, b]) {
        expect(handleAdviceRequest({ id: 4, kind: 'bot', view, style: 'TAG', seed: 0 })).toEqual({
          id: 4,
          ok: true,
          value: decideTag(view, { random: botRandom(0) }),
        });
      }
      for (const view of views()) {
        expect(handleAdviceRequest({ id: 5, kind: 'bot', view, style: 'Rock', seed: 0 })).toEqual({
          id: 5,
          ok: true,
          value: decideRock(view),
        });
      }
    },
    TEST_TIMEOUT_MS,
  );
});
