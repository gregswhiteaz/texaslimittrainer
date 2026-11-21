import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;

interface Run {
  status: number | null;
  /** stdout without npm's `> name@version script` header lines. */
  stdout: string;
}

function playtest(args: string[]): Run {
  const result = spawnSync('npm', ['run', 'playtest', '--', ...args], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
    timeout: TEST_TIMEOUT_MS,
  });
  const lines = result.stdout.split('\n');
  const start = lines.findIndex((line) => line !== '' && !line.startsWith('>'));
  return { status: result.status, stdout: start < 0 ? '' : lines.slice(start).join('\n') };
}

const lines = (text: string) => text.split('\n');
const TABLE_LINE = 'Table: 2 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160';

/** Returns a description of the first heads-up rule the hand breaks, or null. */
function headsUpProblem({ number, final }: PlayedHand): string | null {
  if (final.players.length !== 2) return `hand ${number}: ${final.players.length} players`;
  const button = final.button;
  const other = final.players.map((p) => p.seat).find((seat) => seat !== button);
  const sb = final.actions.find((a) => a.type === 'small-blind');
  const bb = final.actions.find((a) => a.type === 'big-blind');
  if (sb?.seat !== button) return `hand ${number}: small blind by seat ${sb?.seat}`;
  if (bb?.seat !== other) return `hand ${number}: big blind by seat ${bb?.seat}`;
  const firstPreflop = final.actions.find(
    (a) => a.street === 'preflop' && a.type !== 'small-blind' && a.type !== 'big-blind',
  );
  if (firstPreflop !== undefined && firstPreflop.seat !== button) {
    return `hand ${number}: preflop opened by seat ${firstPreflop.seat}`;
  }
  for (const street of ['flop', 'turn', 'river'] as const) {
    const first = final.actions.find((a) => a.street === street);
    if (first !== undefined && first.seat !== other) {
      return `hand ${number}: ${street} opened by seat ${first.seat}`;
    }
  }
  return null;
}

describe('heads-up playtest', () => {
  it(
    'AC#4 10,000 seeded --size 2 hands are all heads-up with heads-up blinds and order and zero violations',
    () => {
      const problems: string[] = [];
      let postflopHands = 0;
      const summary = runPlaytest({ hands: 10000, seed: 42, size: 2 }, (hand) => {
        const problem = headsUpProblem(hand);
        if (problem !== null) problems.push(problem);
        if (hand.final.actions.some((a) => a.street === 'flop')) postflopHands++;
      });
      expect(problems.slice(0, 5)).toEqual([]);
      expect(postflopHands).toBeGreaterThan(0);
      expect(summary.handsPlayed).toBe(10000);
      expect(summary.violations).toBe(0);

      const run = playtest(['--hands', '10000', '--size', '2', '--seed', '42']);
      expect(run.status).toBe(0);
      const out = lines(run.stdout);
      expect(out).toContain('Options: --hands 10000 --seed 42 --size 2');
      expect(out).toContain(TABLE_LINE);
      expect(out).toContain('Hands played: 10000');
      expect(out).toContain('Invariant violations: 0');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#5 npm run playtest -- --size 2 plays heads-up hands and reports 0 violations',
    () => {
      const run = playtest(['--size', '2']);
      expect(run.status).toBe(0);
      const out = lines(run.stdout);
      expect(out).toContain('Options: --hands 10000 --seed 42 --size 2');
      expect(out).toContain(TABLE_LINE);
      expect(out).toContain('Invariant violations: 0');

      const firstCode = out
        .find((line) => line.startsWith('First replay code: '))
        ?.slice('First replay code: '.length);
      expect(firstCode).toMatch(/^[0-9a-f]{32}$/);
      const replay = playtest([
        '--replay-code',
        firstCode as string,
        '--size',
        '2',
        '--button',
        '1',
      ]);
      expect(replay.status).toBe(0);
      const preflop = lines(replay.stdout).find((line) => line.startsWith('Preflop: '));
      expect(preflop).toMatch(/^Preflop: seat 1 posts small blind \$2, seat 2 posts big blind \$4/);
    },
    TEST_TIMEOUT_MS,
  );
});
