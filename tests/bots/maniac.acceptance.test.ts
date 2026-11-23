import { describe, expect, it } from 'vitest';
import { computeEquity, type EquityInput, type EquityResult } from '../../src/advice/equity';
import { handClassOf } from '../../src/advice/hand-class';
import { recommend } from '../../src/advice/recommend';
import { MANIAC_STYLE, decideManiac } from '../../src/bots/maniac';
import { StyleValidationError, parseStyle, type BotStyleData } from '../../src/bots/style';
import { decideTag } from '../../src/bots/tag';
import { botDecisionIndex, botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { formatCard } from '../../src/engine/cards';
import type { ReplayCode } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import maniac from '../../src/bots/styles/maniac.json' with { type: 'json' };

const TEST_TIMEOUT_MS = 120_000;
const SEAT = 1;
const POINTS = 10_000;

const words = (text: string): number => (text.match(/\p{L}+/gu) ?? []).length;
const raw = (): Record<string, unknown> => structuredClone(maniac) as Record<string, unknown>;
const same = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

/** computeEquity, memoized on its input: returns exactly computeEquity's result (A-6). */
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

const isLegal = (view: PlayerView, action: Action): boolean =>
  view.legalActions.some((a) => same(a, action));

/** D-5: seat 1 seeded TAG against random seats, seed 61; its views sorted by the advice. Collected once. */
interface Points {
  check: PlayerView[];
  call: PlayerView[];
  capped: PlayerView[];
}
let collected: Points | undefined;
function collect(): Points {
  if (collected !== undefined) return collected;
  const check: PlayerView[] = [];
  const call: PlayerView[] = [];
  const capped: PlayerView[] = [];
  const summary = runPlaytest({ hands: 200, seed: 61, size: 6 }, undefined, {
    makePolicy: (code, seat) => {
      if (seat !== SEAT) return randomMovePolicy(seatGenerator(code, seat));
      // seededTagPolicy's decision with the memoized equity: the same actions, each equity computed once.
      const policy = (view: PlayerView) =>
        decideTag(view, { random: botRandom(botDecisionSeed(code, view)), equity });
      return (view) => {
        const action = recommend(view, { equity }).action;
        const due = owed(view);
        if (due === 0 && action === 'check') check.push(view);
        if (due > 0 && action === 'call') call.push(view);
        if (due > 0 && view.betCount === 4) capped.push(view);
        return policy(view);
      };
    },
  });
  expect(summary.violations).toBe(0);
  collected = { check, call, capped };
  return collected;
}

/** Point i of `views` under code handReplayCode(game, i + 1), with that decision's seed. */
function at(views: readonly PlayerView[], game: number, i: number) {
  const view = views[i % views.length] as PlayerView;
  const code: ReplayCode = handReplayCode(game, i + 1);
  return { view, code, seed: botDecisionSeed(code, view) };
}

type Point = ReturnType<typeof at>;
/** Each bot's decision at a point, with a fresh generator from the point's seed. */
const maniacAt = (p: Point): Action => decideManiac(p.view, { random: botRandom(p.seed), equity });
const tagAt = (p: Point): Action => decideTag(p.view, { random: botRandom(p.seed), equity });

function count(
  views: readonly PlayerView[],
  game: number,
  decide: (view: PlayerView, seed: number) => Action,
  types: readonly Action['type'][],
): number {
  let n = 0;
  for (let i = 0; i < POINTS; i++) {
    const { view, seed } = at(views, game, i);
    if (types.includes(decide(view, seed).type)) n++;
  }
  return n;
}

const maniacRaises = (views: readonly PlayerView[], style?: BotStyleData): number =>
  count(
    views,
    6402,
    (view, seed) =>
      decideManiac(view, { random: botRandom(seed), equity, ...(style ? { style } : {}) }),
    ['raise'],
  );

function problemsOf(input: unknown): readonly string[] {
  try {
    parseStyle(input, 'maniac.json');
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    return (error as StyleValidationError).problems;
  }
  throw new Error('expected a StyleValidationError');
}

/** A copy of the raw file with the preflop/call deviation changed by `change` (removed if it returns null). */
function withPreflopCall(
  change: (entry: Record<string, unknown>) => Record<string, unknown> | null,
) {
  const copy = raw();
  copy.deviations = (copy.deviations as Record<string, unknown>[]).flatMap((entry) => {
    if (entry.street !== 'preflop' || entry.advice !== 'call') return [entry];
    const changed = change(entry);
    return changed === null ? [] : [changed];
  });
  return parseStyle(copy, 'maniac.json');
}

describe('Maniac from its style file', () => {
  it('the Maniac style file holds its deviation parameters and a description', () => {
    expect(MANIAC_STYLE.style).toBe('Maniac');
    expect(words(MANIAC_STYLE.description)).toBeGreaterThanOrEqual(15);
    expect(MANIAC_STYLE.mixedSpots.size).toBe(0);
    expect(
      MANIAC_STYLE.deviations.map(({ street, advice, instead, probability }) => ({
        street,
        advice,
        instead,
        probability,
      })),
    ).toEqual([
      { street: 'preflop', advice: 'fold', instead: 'raise', probability: 0.45 },
      { street: 'preflop', advice: 'call', instead: 'raise', probability: 0.6 },
      { street: 'preflop', advice: 'check', instead: 'raise', probability: 0.6 },
      { street: 'postflop', advice: 'check', instead: 'bet', probability: 0.6 },
      { street: 'postflop', advice: 'call', instead: 'raise', probability: 0.6 },
    ]);
    for (const deviation of MANIAC_STYLE.deviations) {
      expect(words(deviation.justification)).toBeGreaterThanOrEqual(10);
    }
    expect(parseStyle(raw(), 'maniac.json')).toEqual(MANIAC_STYLE);

    const missing = raw();
    delete missing.description;
    expect(problemsOf(missing)).toContain(
      'maniac.json: style has no plain-English description (at least 15 words)',
    );
    const bad = raw();
    bad.deviations = (bad.deviations as Record<string, unknown>[]).map((entry) =>
      entry.street === 'postflop' && entry.advice === 'call'
        ? { ...entry, probability: 1.5 }
        : entry,
    );
    expect(problemsOf(bad)).toEqual([
      'maniac.json: style Maniac deviation postflop call has an invalid probability',
    ]);
  });

  it(
    'with no bet to face where the advice is check the Maniac bets at more points than TAG',
    () => {
      const { check } = collect();
      expect(check.some((v) => v.street === 'preflop')).toBe(true);
      expect(check.some((v) => v.street !== 'preflop')).toBe(true);
      let bets = 0;
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(check, 6401, i);
        expect(owed(view)).toBe(0);
        expect(recommend(view, { equity }).action).toBe('check');
        const action = decideManiac(view, { random: botRandom(seed), equity });
        const aggressive = view.street === 'preflop' ? 'raise' : 'bet';
        expect(same(action, legal(view, 'check')) || same(action, legal(view, aggressive))).toBe(
          true,
        );
        if (action.type === 'bet' || action.type === 'raise') bets++;
      }
      const tag = count(
        check,
        6401,
        (view, seed) => decideTag(view, { random: botRandom(seed), equity }),
        ['bet', 'raise'],
      );
      expect(bets).toBeGreaterThan(tag);

      // Example A: check[0], flop with 7h Qh, nothing bet; u < 0.6 threshold, the Maniac bets 4.
      const a = at(check, 6401, 0);
      expect(a.code).toBe('00000000000019010000000000000001');
      expect(a.view.street).toBe('flop');
      expect(a.view.holeCards.map(formatCard)).toEqual(['7h', 'Qh']);
      expect(a.view.currentBet).toBe(0);
      expect(a.view.betCount).toBe(0);
      expect(botDecisionIndex(a.view)).toBe(1);
      expect(a.seed).toBe(2616838482);
      expect(botRandom(a.seed).nextUint32()).toBe(2049462343);
      expect(maniacAt(a)).toEqual({ seat: 1, type: 'bet', amount: 4 });
      expect(tagAt(a)).toEqual({ seat: 1, type: 'check' });

      // Example D: check[1], turn with Th 8c; u >= the threshold, both check.
      const d = at(check, 6401, 1);
      expect(d.view.street).toBe('turn');
      expect(d.view.holeCards.map(formatCard)).toEqual(['Th', '8c']);
      expect(d.seed).toBe(3001163493);
      expect(botRandom(d.seed).nextUint32()).toBe(4068788660);
      expect(maniacAt(d)).toEqual({ seat: 1, type: 'check' });

      // Example E: check[2] (check[7] before TASK-7.8), big blind's option with JTo; u < 0.6 threshold, the
      // Maniac raises to 8.
      const e = at(check, 6401, 2);
      expect(e.code).toBe('00000000000019010000000000000003');
      expect(e.view.street).toBe('preflop');
      expect(handClassOf(e.view.holeCards)).toBe('JTo');
      expect(e.view.currentBet).toBe(4);
      expect(e.view.betCount).toBe(1);
      expect(e.seed).toBe(3874910595);
      expect(botRandom(e.seed).nextUint32()).toBe(841821234);
      expect(maniacAt(e)).toEqual({ seat: 1, type: 'raise', amount: 8 });
      expect(tagAt(e)).toEqual({ seat: 1, type: 'check' });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'where the advice is call the Maniac raises at more points than TAG',
    () => {
      const { call } = collect();
      expect(call.some((v) => v.street === 'preflop')).toBe(true);
      expect(call.some((v) => v.street !== 'preflop')).toBe(true);
      let raises = 0;
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(call, 6402, i);
        expect(owed(view)).toBeGreaterThan(0);
        expect(recommend(view, { equity }).action).toBe('call');
        const action = decideManiac(view, { random: botRandom(seed), equity });
        expect(same(action, legal(view, 'call')) || same(action, legal(view, 'raise'))).toBe(true);
        if (action.type === 'raise') raises++;
      }
      const tag = count(
        call,
        6402,
        (view, seed) => decideTag(view, { random: botRandom(seed), equity }),
        ['raise'],
      );
      expect(raises).toBeGreaterThan(tag);

      // Example B: call[3], preflop T8o facing a raise; u < 0.6 threshold, the Maniac raises to 12.
      const b = at(call, 6402, 3);
      expect(b.code).toBe('00000000000019020000000000000004');
      expect(b.view.street).toBe('preflop');
      expect(b.view.holeCards.map(formatCard)).toEqual(['Th', '8c']);
      expect(b.view.currentBet).toBe(8);
      expect(b.view.betCount).toBe(2);
      expect(owed(b.view)).toBe(4);
      expect(b.seed).toBe(4056530141);
      expect(botRandom(b.seed).nextUint32()).toBe(1325301165);
      expect(maniacAt(b)).toEqual({ seat: 1, type: 'raise', amount: 12 });
      expect(tagAt(b)).toEqual({ seat: 1, type: 'call', amount: 4 });

      // Example C: call[1], turn with 7h Qh facing a bet of 8; u ≥ 0.6 threshold, the Maniac calls like TAG.
      const c = at(call, 6402, 1);
      expect(c.code).toBe('00000000000019020000000000000002');
      expect(c.view.street).toBe('turn');
      expect(c.view.holeCards.map(formatCard)).toEqual(['7h', 'Qh']);
      expect(c.view.currentBet).toBe(8);
      expect(c.view.betCount).toBe(1);
      expect(owed(c.view)).toBe(8);
      expect(botDecisionIndex(c.view)).toBe(2);
      expect(c.seed).toBe(3418715972);
      expect(botRandom(c.seed).nextUint32()).toBe(3612399516);
      expect(maniacAt(c)).toEqual({ seat: 1, type: 'call', amount: 8 });
      expect(tagAt(c)).toEqual({ seat: 1, type: 'call', amount: 8 });

      // Example H: call[2], river with 7h Qh facing a bet of 8; u < 0.6 threshold, the Maniac raises to 16.
      const h = at(call, 6402, 2);
      expect(h.code).toBe('00000000000019020000000000000003');
      expect(h.view.street).toBe('river');
      expect(h.view.holeCards.map(formatCard)).toEqual(['7h', 'Qh']);
      expect(h.view.currentBet).toBe(8);
      expect(h.view.betCount).toBe(1);
      expect(owed(h.view)).toBe(8);
      expect(botDecisionIndex(h.view)).toBe(3);
      expect(h.seed).toBe(2239381735);
      expect(botRandom(h.seed).nextUint32()).toBe(111952548);
      expect(recommend(h.view, { equity }).action).toBe('call');
      expect(maniacAt(h)).toEqual({ seat: 1, type: 'raise', amount: 16 });
      expect(tagAt(h)).toEqual({ seat: 1, type: 'call', amount: 8 });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "changing the file's raise probability changes the raise rate with no code change",
    () => {
      const { call } = collect();
      const unmodified = maniacRaises(call);
      const lowered = maniacRaises(
        call,
        withPreflopCall((e) => ({ ...e, probability: 0.2 })),
      );
      expect(lowered).not.toBe(unmodified);
      expect(lowered).toBeLessThan(unmodified);

      const never = maniacRaises(
        call,
        withPreflopCall((e) => ({ ...e, probability: 0 })),
      );
      const removed = maniacRaises(
        call,
        withPreflopCall(() => null),
      );
      expect(never).toBe(removed);

      const always = withPreflopCall((e) => ({ ...e, probability: 1 }));
      let checked = 0;
      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(call, 6402, i);
        if (view.street !== 'preflop' || !view.legalActions.some((a) => a.type === 'raise')) {
          continue;
        }
        const action = decideManiac(view, { random: botRandom(seed), equity, style: always });
        expect(action).toEqual(legal(view, 'raise'));
        checked++;
      }
      expect(checked).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'on a capped street an aggressive Maniac calls and the action is legal',
    () => {
      const { capped } = collect();
      expect(capped.length).toBeGreaterThan(0);
      const aggressive = { nextUint32: () => 0 };
      for (const view of capped) {
        expect(view.legalActions.some((a) => a.type === 'raise')).toBe(false);
        const advice = recommend(view, { equity });
        expect(
          advice.action === 'call' || (view.street === 'preflop' && advice.action === 'fold'),
        ).toBe(true);
        expect(decideManiac(view, { random: aggressive, equity })).toEqual(legal(view, 'call'));
      }

      for (let i = 0; i < POINTS; i++) {
        const { view, seed } = at(capped, 6403, i);
        const action = decideManiac(view, { random: botRandom(seed), equity });
        expect(isLegal(view, action)).toBe(true);
        expect(action.type).not.toBe('raise');
        if (!same(action, recommend(view, { equity }).move)) {
          expect(action).toEqual(legal(view, 'call'));
        }
      }

      // Example F: capped[1], preflop 82o facing the cap; aggressive draw, the raise is illegal, so it calls 14.
      const f = at(capped, 6403, 1);
      expect(f.code).toBe('00000000000019030000000000000002');
      expect(f.view.street).toBe('preflop');
      expect(handClassOf(f.view.holeCards)).toBe('82o');
      expect(f.view.currentBet).toBe(16);
      expect(f.view.betCount).toBe(4);
      expect(owed(f.view)).toBe(14);
      expect(f.view.legalActions.map((a) => a.type)).toEqual(['fold', 'call']);
      expect(f.seed).toBe(2743905521);
      expect(botRandom(f.seed).nextUint32()).toBe(1644137980);
      expect(maniacAt(f)).toEqual({ seat: 1, type: 'call', amount: 14 });
      expect(tagAt(f)).toEqual({ seat: 1, type: 'fold' });

      // Example G: capped[0], preflop 7h Qh owing 16; it calls under an aggressive and a passive draw.
      const g = capped[0] as PlayerView;
      expect(g.street).toBe('preflop');
      expect(g.holeCards.map(formatCard)).toEqual(['7h', 'Qh']);
      expect(owed(g)).toBe(16);
      const call16 = { seat: 1, type: 'call', amount: 16 };
      const hot = handReplayCode(6403, 181);
      expect(hot).toBe('000000000000190300000000000000b5');
      expect(botDecisionSeed(hot, g)).toBe(2161863358);
      expect(botRandom(2161863358).nextUint32()).toBe(405360754);
      expect(decideManiac(g, { random: botRandom(2161863358) })).toEqual(call16);
      const cold = handReplayCode(6403, 1);
      expect(botDecisionSeed(cold, g)).toBe(2624173068);
      expect(botRandom(2624173068).nextUint32()).toBe(3679267233);
      expect(decideManiac(g, { random: botRandom(2624173068) })).toEqual(call16);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'a Maniac seat in the worker plays the Maniac decision',
    () => {
      const view = collect().call[3] as PlayerView;
      const request = { id: 1, kind: 'bot', view, seed: 4056530141 } as const;
      expect(handleAdviceRequest({ ...request, style: 'Maniac' })).toEqual({
        id: 1,
        ok: true,
        value: { seat: 1, type: 'raise', amount: 12 },
      });
      expect(handleAdviceRequest({ ...request, style: 'TAG' })).toEqual({
        id: 1,
        ok: true,
        value: { seat: 1, type: 'call', amount: 4 },
      });
      for (let i = 0; i < POINTS; i++) {
        const point = at(collect().check, 6401, i);
        expect(
          handleAdviceRequest({
            id: i,
            kind: 'bot',
            view: point.view,
            style: 'Maniac',
            seed: point.seed,
          }),
        ).toEqual({
          id: i,
          ok: true,
          value: decideManiac(point.view, { random: botRandom(point.seed) }),
        });
      }
    },
    TEST_TIMEOUT_MS,
  );
});
