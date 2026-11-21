import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recommend } from '../../src/advice/recommend';
import { botDecisionSeed, botRandom, seatGenerator } from '../../src/engine/bot-random';
import { decideTag } from '../../src/bots/tag';
import { replayCodeFromWords, shuffledDeck, type ReplayCode } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { handReplayCode, playHand } from '../../src/playtest/runner';
import { handleAdviceRequest, type AdviceRequest } from '../../src/table/advice-service';
import {
  applyUserAction,
  botTurn,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';
import { SCENARIO_CODE } from '../support/table-scenarios';

const TEST_TIMEOUT_MS = 120_000;

interface DecisionPoint {
  readonly code: ReplayCode;
  readonly view: PlayerView;
}

/** The first `count` TAG decision points of all-TAG 6-max playtest hands from seed 18. */
function decisionPoints(count: number): DecisionPoint[] {
  const points: DecisionPoint[] = [];
  for (let n = 1; points.length < count; n++) {
    const code = handReplayCode(18, n);
    playHand(code, 6, 6, n, {
      makePolicy: () => (view) => {
        points.push({ code, view });
        return decideTag(view);
      },
    });
  }
  return points.slice(0, count);
}

function decide({ code, view }: DecisionPoint): { seed: number; action: Action } {
  const seed = botDecisionSeed(code, view);
  return { seed, action: decideTag(view, { random: botRandom(seed) }) };
}

/** A dealt table at a bot turn after the user has made at least one decision. */
function botTurnAfterUser(): TableState {
  let t = dealHand(seatSession(), SCENARIO_CODE);
  while (nextStep(t) !== 'done') {
    if (nextStep(t) === 'bot') {
      if (t.userDecisions.length > 0) return t;
      t = stepBot(t);
    } else {
      const options = userActions(t);
      t = applyUserAction(
        t,
        (options.find((a) => a.type === 'raise') ??
          options.find((a) => a.type === 'bet') ??
          options.find((a) => a.type === 'call')) as Action,
      );
    }
  }
  throw new Error('no bot turn after a user decision');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('bot randomness (TASK-6.18)', () => {
  it(
    'same code seat and decision point give the same TAG action',
    () => {
      const points = decisionPoints(200);
      expect(points).toHaveLength(200);
      points.forEach((point, i) => {
        const first = decide(point);
        const second = decide(point);
        expect(second).toEqual(first);
        expect(first.action).toEqual(decideTag(point.view));
        if (i % 10 === 0) {
          const request: AdviceRequest = {
            id: i,
            kind: 'bot',
            view: point.view,
            style: 'TAG',
            seed: first.seed,
          };
          const expected = { id: i, ok: true, value: first.action };
          expect(handleAdviceRequest(request)).toEqual(expected);
          expect(handleAdviceRequest(request)).toEqual(expected);
        }
      });
      // Several decisions per seat per hand, so k > 0 is covered.
      expect(new Set(points.map((p) => `${p.code}/${p.view.seat}`)).size).toBeLessThan(200);
    },
    TEST_TIMEOUT_MS,
  );

  it('a different seat gives a different random sequence', () => {
    const code = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);
    const sequences = Array.from({ length: 10 }, (_, i) => {
      const generator = seatGenerator(code, i + 1);
      return Array.from({ length: 8 }, () => generator.nextUint32()).join(',');
    });
    expect(new Set(sequences).size).toBe(10);
    expect(sequences[0]?.split(',')[0]).toBe('1024787557');
    expect(sequences[1]?.split(',')[0]).toBe('2122845982');

    const word = fc.integer({ min: 0, max: 0xffffffff });
    fc.assert(
      fc.property(
        fc.tuple(word, word, word, word),
        fc.uniqueArray(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 2 }),
        (words, [a, b]) => {
          const c = replayCodeFromWords(words);
          const first4 = (seat: number): number[] => {
            const generator = seatGenerator(c, seat);
            return Array.from({ length: 4 }, () => generator.nextUint32());
          };
          expect(first4(a as number)).not.toEqual(first4(b as number));
        },
      ),
      { numRuns: 200, seed: 618 },
    );
  });

  it('time and other draws do not change the bot decision', () => {
    const point = decisionPoints(40).find((p) => p.view.street === 'flop');
    if (point === undefined) throw new Error('no flop decision point');

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const randomA = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(Date.now()).toBe(Date.UTC(2026, 0, 1));
    const runA = decide(point);
    expect(randomA).toHaveBeenCalledTimes(0);
    vi.restoreAllMocks();

    vi.setSystemTime(new Date('2031-06-15T12:34:56Z'));
    const randomB = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    vi.spyOn(performance, 'now').mockReturnValue(987_654.321);
    for (const n of [101, 102, 103]) shuffledDeck(handReplayCode(5, n));
    for (let seat = 1; seat <= 6; seat++) {
      if (seat === point.view.seat) continue;
      const generator = seatGenerator(point.code, seat);
      for (let i = 0; i < 37; i++) generator.nextUint32();
    }
    expect(Date.now()).toBe(Date.UTC(2031, 5, 15, 12, 34, 56));
    const runB = decide(point);
    expect(randomB).toHaveBeenCalledTimes(0);

    expect(runB).toEqual(runA);
  });

  it('observed statistics never reach a bot decision', () => {
    const observed = botTurnAfterUser();
    expect(observed.userDecisions.length).toBeGreaterThan(0);
    const unobserved: TableState = { ...observed, userDecisions: [] };

    const a = botTurn(observed);
    const b = botTurn(unobserved);
    expect({ view: b.view, style: b.style, seed: b.seed }).toEqual({
      view: a.view,
      style: a.style,
      seed: a.seed,
    });
    for (const turn of [a, b]) {
      expect(decideTag(turn.view, { random: botRandom(turn.seed) })).toEqual(
        recommend(turn.view).move,
      );
    }

    const request: AdviceRequest = {
      id: 1,
      kind: 'bot',
      view: a.view,
      style: a.style,
      seed: a.seed,
    };
    const withStats = {
      ...request,
      opponentStats: { 1: { vpip: 99, pfr: 99, hands: 500 } },
    } as unknown as AdviceRequest;
    const plain = handleAdviceRequest(request);
    expect(plain.ok).toBe(true);
    expect(handleAdviceRequest(withStats)).toEqual(plain);
  });
});
