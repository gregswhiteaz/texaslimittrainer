import { spawnSync } from 'node:child_process';
import { describe, expect, it, vi } from 'vitest';
import type { Recommendation, RecommendOptions } from '../../src/advice/recommend';
import { decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { checkStep, type Violation } from '../../src/engine/invariants';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { main } from '../../src/playtest/cli';
import { seededTagPolicy } from '../../src/playtest/policy';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;

const spy = vi.hoisted(() => ({
  recording: false,
  calls: [] as { view: PlayerView; result: Recommendation }[],
}));

vi.mock('../../src/advice/recommend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/advice/recommend')>();
  return {
    ...actual,
    recommend: (view: PlayerView, options?: RecommendOptions): Recommendation => {
      const result = actual.recommend(view, options);
      if (spy.recording) spy.calls.push({ view, result });
      return result;
    },
  };
});

/** stdout of `npm run playtest -- <args>` without npm's `> name@version script` header lines. */
function playtest(args: string[], timeout: number) {
  const result = spawnSync('npm', ['run', 'playtest', '--', ...args], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
    timeout,
  });
  const lines = result.stdout.split('\n');
  const start = lines.findIndex((line) => line !== '' && !line.startsWith('>'));
  return { status: result.status, stdout: start < 0 ? '' : lines.slice(start).join('\n') };
}

describe('TAG bots in the playtest', () => {
  it(
    'AC#5 the default 10,000-hand playtest is all TAG, legal and clean',
    () => {
      const run = playtest(['--hands', '10000', '--seed', '42'], 60_000);
      expect(run.status).toBe(0);
      const lines = run.stdout.split('\n');
      expect(lines).toContain('Hands played: 10000');
      expect(lines).toContain('Invariant violations: 0');
      let out = '';
      let err = '';
      const code = main(
        ['--hands', '10000', '--seed', '42'],
        { out: (t) => (out += t), err: (t) => (err += t) },
        { makePolicy: (code) => seededTagPolicy(code) },
      );
      expect(code).toBe(0);
      expect(err).toBe('');
      expect(run.stdout === out).toBe(true);

      let steps = 0;
      let hand = 1;
      const mismatches: string[] = [];
      const summary = runPlaytest(
        { hands: 10000, seed: 42, size: 6 },
        () => {
          hand++;
        },
        {
          onAction: (step): readonly Violation[] => {
            steps++;
            const view = playerView(step.before, step.before.toAct as number);
            const legal = view.legalActions.some(
              (a) => JSON.stringify(a) === JSON.stringify(step.action),
            );
            const replayCode = handReplayCode(42, hand);
            const seeded = decideTag(view, {
              random: botRandom(botDecisionSeed(replayCode, view)),
            });
            if (!legal || JSON.stringify(step.action) !== JSON.stringify(seeded)) {
              mismatches.push(JSON.stringify(step.action));
            }
            return checkStep(step);
          },
        },
      );
      expect(mismatches).toEqual([]);
      expect(steps).toBe(summary.playerActions);
      expect(summary.handsPlayed).toBe(10000);
      expect(summary.violations).toBe(0);
    },
    TEST_TIMEOUT_MS,
  );

  it('AC#6 TAG acts through recommend on every street and plays its move', () => {
    spy.calls.length = 0;
    spy.recording = true;
    let actions = 0;
    let hand = 1;
    const problems: string[] = [];
    try {
      const summary = runPlaytest(
        { hands: 300, seed: 6, size: 6 },
        () => {
          hand++;
        },
        {
          onAction: (step) => {
            actions++;
            const call = spy.calls[actions - 1];
            if (spy.calls.length !== actions || call === undefined) {
              problems.push(`action ${actions}: ${spy.calls.length} recommend calls`);
            } else {
              if (call.view.seat !== step.action.seat)
                problems.push(`action ${actions}: wrong seat`);
              spy.recording = false;
              const seeded = decideTag(call.view, {
                random: botRandom(botDecisionSeed(handReplayCode(6, hand), call.view)),
              });
              spy.recording = true;
              if (JSON.stringify(seeded) !== JSON.stringify(step.action)) {
                problems.push(`action ${actions}: played ${JSON.stringify(step.action)}`);
              }
            }
            return checkStep(step);
          },
        },
      );
      expect(summary.violations).toBe(0);
    } finally {
      spy.recording = false;
    }
    expect(problems).toEqual([]);
    expect(actions).toBeGreaterThan(0);
    expect(spy.calls).toHaveLength(actions);
    expect(new Set(spy.calls.map((c) => c.view.street))).toEqual(
      new Set(['preflop', 'flop', 'turn', 'river']),
    );
  });
});
