import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { handClassOf } from '../../src/advice/hand-class';
import { recommend } from '../../src/advice/recommend';
import { CALLING_STATION_STYLE, decideCallingStation } from '../../src/bots/calling-station';
import { StyleValidationError, parseStyle, type BotStyleData } from '../../src/bots/style';
import { decideTag } from '../../src/bots/tag';
import { botDecisionIndex, botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { formatCard } from '../../src/engine/cards';
import type { ReplayCode } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import callingStation from '../../src/bots/styles/calling-station.json' with { type: 'json' };

const TEST_TIMEOUT_MS = 120_000;
const SEAT = 1;
const POINTS = 10_000;

const words = (text: string): number => (text.match(/\p{L}+/gu) ?? []).length;
const raw = (): Record<string, unknown> =>
  structuredClone(callingStation) as Record<string, unknown>;
const same = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

/** computeEquity, memoized on its input: returns exactly computeEquity's result (A-7). */
const memo = new Map<string, EquityResult>();
function equity(input: EquityInput): EquityResult {
  const key = JSON.stringify(input);
  let result = memo.get(key);
  if (result === undefined) {
    result = computeEquity(input);
    memo.set(key, result);
  }
  return result;
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

/** D-5: seat 1 seeded TAG against random seats, seed 61; its views sorted by the advice. Collected once. */
interface Points {
  fold: PlayerView[];
  raise: PlayerView[];
  free: PlayerView[];
}
let collected: Points | undefined;
function collect(): Points {
  if (collected !== undefined) return collected;
  const fold: PlayerView[] = [];
  const raise: PlayerView[] = [];
  const free: PlayerView[] = [];
  const summary = runPlaytest({ hands: 200, seed: 61, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      if (seat !== SEAT) return randomMovePolicy(seatGenerator(code, seat));
      const policy = seededTagPolicy(code);
      return (view) => {
        const action = recommend(view, { equity }).action;
        if (action === 'fold') fold.push(view);
        else if (action === 'raise') (owed(view) > 0 ? raise : free).push(view);
        return policy(view);
      };
    },
  });
  expect(summary.violations).toBe(0);
  collected = { fold, raise, free };
  return collected;
}

/** Point i of `views` under code handReplayCode(game, i + 1), with that decision's seed. */
function at(views: readonly PlayerView[], game: number, i: number) {
  const view = views[i % views.length] as PlayerView;
  const code: ReplayCode = handReplayCode(game, i + 1);
  return { view, code, seed: botDecisionSeed(code, view) };
}

function stationCalls(views: readonly PlayerView[], game: number, style?: BotStyleData): number {
  let calls = 0;
  for (let i = 0; i < POINTS; i++) {
    const { view, seed } = at(views, game, i);
    const options = { random: botRandom(seed), equity, ...(style ? { style } : {}) };
    if (decideCallingStation(view, options).type === 'call') calls++;
  }
  return calls;
}

function tagCalls(views: readonly PlayerView[], game: number): number {
  let calls = 0;
  for (let i = 0; i < POINTS; i++) {
    const { view, seed } = at(views, game, i);
    if (decideTag(view, { random: botRandom(seed), equity }).type === 'call') calls++;
  }
  return calls;
}

function problemsOf(input: unknown): readonly string[] {
  try {
    parseStyle(input, 'calling-station.json');
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    return (error as StyleValidationError).problems;
  }
  throw new Error('expected a StyleValidationError');
}

/** A copy of the raw file with the preflop/fold deviation changed by `change` (removed if it returns null). */
function withPreflopFold(
  change: (entry: Record<string, unknown>) => Record<string, unknown> | null,
) {
  const copy = raw();
  copy.deviations = (copy.deviations as Record<string, unknown>[]).flatMap((entry) => {
    if (entry.street !== 'preflop' || entry.advice !== 'fold') return [entry];
    const changed = change(entry);
    return changed === null ? [] : [changed];
  });
  return parseStyle(copy, 'calling-station.json');
}

describe('Calling station from its style file', () => {
  it('the Calling station style file holds its deviation parameters and a description', () => {
    expect(CALLING_STATION_STYLE.style).toBe('Calling station');
    expect(words(CALLING_STATION_STYLE.description)).toBeGreaterThanOrEqual(15);
    expect(CALLING_STATION_STYLE.mixedSpots.size).toBe(0);
    expect(
      CALLING_STATION_STYLE.deviations.map(({ street, advice, instead, probability }) => ({
        street,
        advice,
        instead,
        probability,
      })),
    ).toEqual([
      { street: 'preflop', advice: 'fold', instead: 'call', probability: 0.5 },
      { street: 'preflop', advice: 'raise', instead: 'call', probability: 0.6 },
      { street: 'postflop', advice: 'fold', instead: 'call', probability: 0.5 },
    ]);
    for (const deviation of CALLING_STATION_STYLE.deviations) {
      expect(words(deviation.justification)).toBeGreaterThanOrEqual(10);
    }
    expect(parseStyle(raw(), 'calling-station.json')).toEqual(CALLING_STATION_STYLE);

    const missing = raw();
    delete missing.description;
    expect(problemsOf(missing)).toContain(
      'calling-station.json: style has no plain-English description (at least 15 words)',
    );
    const bad = raw();
    (bad.deviations as Record<string, unknown>[])[0] = {
      ...(bad.deviations as Record<string, unknown>[])[0],
      probability: 1.5,
    };
    expect(problemsOf(bad)).toEqual([
      'calling-station.json: style Calling station deviation preflop fold has an invalid probability',
    ]);
  });

  it(
    'facing a bet where the advice is fold the Calling station calls at more points than TAG',
    () => {
      const { fold } = collect();
      expect(fold.some((v) => v.street !== 'preflop')).toBe(true);
      let station = 0;
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(fold, 6003, i);
        const advice = recommend(view, { equity });
        expect(advice.action).toBe('fold');
        expect(owed(view)).toBeGreaterThan(0);
        const action = decideCallingStation(view, { random: botRandom(seed), equity });
        expect(same(action, advice.move) || same(action, legal(view, 'call'))).toBe(true);
        if (action.type === 'call') station++;
      }
      expect(station).toBeGreaterThan(tagCalls(fold, 6003));

      // Example C: fold[0], CO 97o facing a raise; u >= 2^31, the station folds like TAG.
      const c = at(fold, 6003, 0);
      expect(c.code).toBe('00000000000017730000000000000001');
      expect(c.view.street).toBe('preflop');
      expect(handClassOf(c.view.holeCards)).toBe('97o');
      expect(recommend(c.view)).toMatchObject({
        position: 'CO',
        situation: 'raise',
        action: 'fold',
      });
      expect(c.seed).toBe(4053618777);
      expect(botRandom(c.seed).nextUint32()).toBe(2247995765);
      expect(decideCallingStation(c.view, { random: botRandom(c.seed) })).toEqual({
        seat: 1,
        type: 'fold',
      });

      // Example B: fold[30], flop with 5c 3c facing a bet; u < 2^31, the station calls 4 where TAG folds.
      const b = at(fold, 6003, 30);
      expect(b.code).toBe('0000000000001773000000000000001f');
      expect(b.view.street).toBe('flop');
      expect(b.view.holeCards.map(formatCard)).toEqual(['5c', '3c']);
      expect(b.view.currentBet).toBe(4);
      expect(botDecisionIndex(b.view)).toBe(1);
      expect(b.seed).toBe(2826725471);
      expect(botRandom(b.seed).nextUint32()).toBe(523750097);
      expect(decideCallingStation(b.view, { random: botRandom(b.seed), equity })).toEqual({
        seat: 1,
        type: 'call',
        amount: 4,
      });
      expect(decideTag(b.view, { random: botRandom(b.seed), equity })).toEqual({
        seat: 1,
        type: 'fold',
      });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'where the advice is raise the Calling station calls at more points than TAG',
    () => {
      const { raise } = collect();
      let station = 0;
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(raise, 6004, i);
        const advice = recommend(view, { equity });
        expect(advice.action).toBe('raise');
        expect(owed(view)).toBeGreaterThan(0);
        const action = decideCallingStation(view, { random: botRandom(seed), equity });
        expect(same(action, advice.move) || same(action, legal(view, 'call'))).toBe(true);
        if (action.type === 'call') station++;
      }
      expect(station).toBeGreaterThan(tagCalls(raise, 6004));

      // Example A: raise[0], SB AQo over limpers, decided under handReplayCode(6004, 2).
      const view = raise[0] as PlayerView;
      const code = handReplayCode(6004, 2);
      expect(code).toBe('00000000000017740000000000000002');
      expect(handClassOf(view.holeCards)).toBe('AQo');
      expect(recommend(view)).toMatchObject({
        position: 'SB',
        situation: 'limpers',
        alternative: null,
      });
      expect(view.currentBet).toBe(4);
      expect(botDecisionIndex(view)).toBe(0);
      const seed = botDecisionSeed(code, view);
      expect(seed).toBe(3757549955);
      expect(botRandom(seed).nextUint32()).toBe(1339328068);
      expect(decideCallingStation(view, { random: botRandom(seed) })).toEqual({
        seat: 1,
        type: 'call',
        amount: 2,
      });
      expect(decideTag(view, { random: botRandom(seed) })).toEqual({
        seat: 1,
        type: 'raise',
        amount: 8,
      });

      // D-5 point 0: u >= the 0.6 threshold, both raise to 8.
      const zero = at(raise, 6004, 0);
      expect(zero.code).toBe('00000000000017740000000000000001');
      expect(zero.seed).toBe(3761756536);
      expect(botRandom(zero.seed).nextUint32()).toBe(3312332681);
      const raiseTo8 = { seat: 1, type: 'raise', amount: 8 };
      expect(decideCallingStation(zero.view, { random: botRandom(zero.seed) })).toEqual(raiseTo8);
      expect(decideTag(zero.view, { random: botRandom(zero.seed) })).toEqual(raiseTo8);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "changing the file's call probability changes the call rate with no code change",
    () => {
      const { fold } = collect();
      const unmodified = stationCalls(fold, 6003);
      const lowered = stationCalls(
        fold,
        6003,
        withPreflopFold((e) => ({ ...e, probability: 0.2 })),
      );
      expect(lowered).not.toBe(unmodified);
      expect(lowered).toBeLessThan(unmodified);

      const never = stationCalls(
        fold,
        6003,
        withPreflopFold((e) => ({ ...e, probability: 0 })),
      );
      const removed = stationCalls(
        fold,
        6003,
        withPreflopFold(() => null),
      );
      expect(never).toBe(removed);

      const always = withPreflopFold((e) => ({ ...e, probability: 1 }));
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(fold, 6003, i);
        if (view.street !== 'preflop') continue;
        const action = decideCallingStation(view, {
          random: botRandom(seed),
          equity,
          style: always,
        });
        expect(action).toEqual(legal(view, 'call'));
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'with no bet to face the Calling station checks or bets and never folds',
    () => {
      const seen = { preflop: 0, postflop: 0 };
      const summary = runPlaytest({ hands: 200, seed: 62, size: 6 }, undefined, {
        makePolicy: (code, seat) => {
          if (seat !== SEAT) return randomMovePolicy(seatGenerator(code, seat));
          return (view) => {
            const action = decideCallingStation(view, {
              random: botRandom(botDecisionSeed(code, view)),
            });
            if (owed(view) === 0) {
              expect(['check', 'bet', 'raise']).toContain(action.type);
              seen[view.street === 'preflop' ? 'preflop' : 'postflop']++;
            }
            return action;
          };
        },
      });
      expect(summary.violations).toBe(0);
      expect(seen.preflop + seen.postflop).toBeGreaterThanOrEqual(100);
      expect(seen.preflop).toBeGreaterThanOrEqual(1);
      expect(seen.postflop).toBeGreaterThanOrEqual(1);

      const view = collect().free[0] as PlayerView;
      expect(view).toBeDefined();
      const check = legal(view, 'check');
      const raise = legal(view, 'raise');
      const counts = { check: 0, raise: 0 };
      for (let i = 1; i <= 1000; i++) {
        const code = handReplayCode(6005, i);
        const action = decideCallingStation(view, {
          random: botRandom(botDecisionSeed(code, view)),
        });
        if (same(action, check)) counts.check++;
        else if (same(action, raise)) counts.raise++;
        else throw new Error(`played ${JSON.stringify(action)}`);
      }
      expect(counts.check).toBeGreaterThan(0);
      expect(counts.raise).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'a Calling station seat in the worker plays the Calling station decision',
    () => {
      const view = collect().raise[0] as PlayerView;
      const request = { id: 1, kind: 'bot', view, seed: 3757549955 } as const;
      expect(handleAdviceRequest({ ...request, style: 'Calling station' })).toEqual({
        id: 1,
        ok: true,
        value: { seat: 1, type: 'call', amount: 2 },
      });
      expect(handleAdviceRequest({ ...request, style: 'TAG' })).toEqual({
        id: 1,
        ok: true,
        value: { seat: 1, type: 'raise', amount: 8 },
      });
      for (let i = 0; i < POINTS; i++) {
        const point = at(collect().raise, 6004, i);
        expect(
          handleAdviceRequest({
            id: i,
            kind: 'bot',
            view: point.view,
            style: 'Calling station',
            seed: point.seed,
          }),
        ).toEqual({
          id: i,
          ok: true,
          value: decideCallingStation(point.view, { random: botRandom(point.seed) }),
        });
      }
    },
    TEST_TIMEOUT_MS,
  );
});
