import { describe, expect, it } from 'vitest';
import { handClassOf } from '../../src/advice/hand-class';
import { recommend } from '../../src/advice/recommend';
import { StyleValidationError, parseStyle } from '../../src/bots/style';
import { decideTag, TAG_STYLE } from '../../src/bots/tag';
import { botDecisionIndex, botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { Action } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { checkStep } from '../../src/engine/invariants';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import tagStyle from '../../src/bots/styles/tag.json' with { type: 'json' };

const TEST_TIMEOUT_MS = 120_000;
const TAG_SEAT = 1;
const MIXED = ['unopened', 'limpers', 'raise', 'raise-and-calls', 'blind-defence'] as const;
const CODES = Array.from({ length: 1000 }, (_, i) => handReplayCode(6002, i + 1));

const words = (text: string): number => (text.match(/\p{L}+/gu) ?? []).length;
const raw = (): Record<string, unknown> => structuredClone(tagStyle) as Record<string, unknown>;

function problemsOf(input: unknown): readonly string[] {
  try {
    parseStyle(input, 'tag.json');
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    expect((error as Error).message).toContain('tag.json');
    return (error as StyleValidationError).problems;
  }
  throw new Error('expected a StyleValidationError');
}

/** The first TAG view with an acceptable alternative in each preflop situation (TAG at seat 1, seed 61). */
function alternativeViews(): Map<string, PlayerView> {
  const found = new Map<string, PlayerView>();
  const summary = runPlaytest({ hands: 200, seed: 61, size: 6 }, undefined, {
    makePolicy: (code, seat) =>
      seat === TAG_SEAT
        ? (view) => {
            const advice = recommend(view);
            if (advice.basis === 'chart' && advice.alternative !== null) {
              if (!found.has(advice.situation)) found.set(advice.situation, view);
            }
            return decideTag(view);
          }
        : randomMovePolicy(seatGenerator(code, seat)),
  });
  expect(summary.violations).toBe(0);
  return found;
}

const seeded = (code: Parameters<typeof botDecisionSeed>[0], view: PlayerView): Action =>
  decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });

/** The first preflop view of `seat` in hand `hand` of the seed-42 6-max playtest. */
function seed42View(hand: number, seat: number): PlayerView {
  const code = handReplayCode(42, hand);
  let found: PlayerView | undefined;
  runPlaytest({ hands: hand, seed: 42, size: 6 }, undefined, {
    makePolicy: (c, s) => {
      const policy = seededTagPolicy(c);
      return (view) => {
        if (c === code && s === seat && found === undefined) found = view;
        return policy(view);
      };
    },
  });
  if (found === undefined) throw new Error(`seat ${seat} never acted in hand ${hand}`);
  return found;
}

describe('TAG mixing from its style file', () => {
  it("TAG's style file holds its mixed spots and a description", () => {
    expect(TAG_STYLE.style).toBe('TAG');
    expect(words(TAG_STYLE.description)).toBeGreaterThanOrEqual(15);
    expect([...TAG_STYLE.mixedSpots.keys()].sort()).toEqual(
      MIXED.map((s) => `preflop-${s}`).sort(),
    );
    for (const spot of TAG_STYLE.mixedSpots.values()) {
      expect({ recommended: spot.recommended, alternative: spot.alternative }).toEqual({
        recommended: 0.75,
        alternative: 0.25,
      });
      expect(words(spot.justification)).toBeGreaterThanOrEqual(10);
    }
    expect(TAG_STYLE.mixedSpots.has('preflop-re-raise')).toBe(false);
    expect(parseStyle(raw(), 'tag.json')).toEqual(TAG_STYLE);
  });

  it('a style file without a description fails naming the file', () => {
    const message = 'tag.json: style has no plain-English description (at least 15 words)';
    const missing = raw();
    delete missing.description;
    for (const input of [
      missing,
      { ...raw(), description: '' },
      { ...raw(), description: 'Plays tight poker' },
    ]) {
      expect(problemsOf(input)).toContain(message);
    }
  });

  it('a mixed spot needs two actions of non-zero probability', () => {
    const message =
      'tag.json: style TAG marks spot type preflop-raise as mixed with fewer than two actions of non-zero probability';
    for (const actions of [
      { recommended: 1, alternative: 0 },
      { recommended: 0, alternative: 1 },
    ]) {
      const input = raw();
      input.mixedSpots = (input.mixedSpots as { spot: string }[]).map((entry) =>
        entry.spot === 'preflop-raise' ? { ...entry, actions } : entry,
      );
      expect(problemsOf(input)).toEqual([message]);
    }
    expect(() => parseStyle(raw(), 'tag.json')).not.toThrow();
  });

  it(
    'in a mixed spot TAG chooses only the recommendation or the alternative and each at least once',
    () => {
      const views = alternativeViews();
      for (const situation of MIXED) {
        const view = views.get(situation);
        expect(view, situation).toBeDefined();
        const advice = recommend(view as PlayerView);
        if (advice.basis !== 'chart' || advice.alternative === null) throw new Error(situation);
        const type = advice.alternative;
        const alternative = view?.legalActions.find((a) => a.type === type);
        expect(alternative, situation).toBeDefined();
        let recommended = 0;
        let alternatives = 0;
        for (const code of CODES) {
          const action = seeded(code, view as PlayerView);
          if (JSON.stringify(action) === JSON.stringify(advice.move)) recommended++;
          else if (JSON.stringify(action) === JSON.stringify(alternative)) alternatives++;
          else throw new Error(`${situation}: played ${JSON.stringify(action)}`);
        }
        expect(recommended, situation).toBeGreaterThan(0);
        expect(alternatives, situation).toBeGreaterThan(0);
      }

      // Hand-worked examples, seed-42 playtest (button 1); the spec's seat numbers were corrected
      // against the code (see build-log.md).
      // Example 1: hand 1, seat 1 (BTN) with ATo facing one raise; u >= 2^30, the recommended fold is kept.
      const code1 = handReplayCode(42, 1);
      expect(code1).toBe('000000000000002a0000000000000001');
      const view1 = seed42View(1, 1);
      expect(handClassOf(view1.holeCards)).toBe('ATo');
      expect(recommend(view1)).toMatchObject({
        basis: 'chart',
        position: 'BTN',
        situation: 'raise',
        action: 'fold',
        alternative: 'raise',
      });
      expect(botDecisionIndex(view1)).toBe(0);
      expect(botDecisionSeed(code1, view1)).toBe(600557987);
      expect(botRandom(600557987).nextUint32()).toBe(3626515352);
      expect(seeded(code1, view1)).toEqual({ seat: 1, type: 'fold' });

      // Example 2: hand 4, seat 3 (CO) with A6o unopened; u < 2^30, the alternative raise is drawn.
      const code4 = handReplayCode(42, 4);
      const view4 = seed42View(4, 3);
      expect(handClassOf(view4.holeCards)).toBe('A6o');
      expect(recommend(view4)).toMatchObject({
        basis: 'chart',
        position: 'CO',
        situation: 'unopened',
        action: 'fold',
        alternative: 'raise',
      });
      expect(botDecisionIndex(view4)).toBe(0);
      const seed4 = botDecisionSeed(code4, view4);
      expect(seed4).toBe(1408880392);
      expect(botRandom(seed4).nextUint32()).toBe(168862582);
      const raise = view4.legalActions.find((a) => a.type === 'raise');
      expect(raise).toBeDefined();
      expect(seeded(code4, view4)).toEqual(raise);
      expect(
        handleAdviceRequest({ id: 1, kind: 'bot', view: view4, style: 'TAG', seed: seed4 }),
      ).toEqual({ id: 1, ok: true, value: raise });
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'outside mixed spots TAG plays the recommended action',
    () => {
      const view = alternativeViews().get('re-raise');
      expect(view).toBeDefined();
      const move = recommend(view as PlayerView).move;
      for (const code of CODES) expect(seeded(code, view as PlayerView)).toEqual(move);

      let checked = 0;
      let postflop = 0;
      let noAlternative = 0;
      let hand = 1;
      const summary = runPlaytest(
        { hands: 300, seed: 6, size: 6 },
        () => {
          hand++;
        },
        {
          onAction: (step) => {
            const seen = playerView(step.before, step.action.seat);
            const advice = recommend(seen);
            const mixed =
              advice.basis === 'chart' &&
              advice.alternative !== null &&
              advice.situation !== 're-raise';
            if (!mixed) {
              expect(step.action, `hand ${hand}`).toEqual(advice.move);
              checked++;
              if (advice.basis === 'equity') postflop++;
              else if (advice.alternative === null) noAlternative++;
            } else {
              expect(step.action).toEqual(seeded(handReplayCode(6, hand), seen));
            }
            return checkStep(step);
          },
        },
      );
      expect(summary.violations).toBe(0);
      expect(postflop).toBeGreaterThan(0);
      expect(noAlternative).toBeGreaterThan(0);
      expect(checked).toBeGreaterThanOrEqual(100);
    },
    TEST_TIMEOUT_MS,
  );
});
