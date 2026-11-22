import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { main, USAGE } from '../../src/playtest/cli';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 120_000;
const SLOW_RUN_LIMIT_MS = 300_000;

interface Run {
  status: number | null;
  /** stdout without npm's `> name@version script` header lines. */
  stdout: string;
  stderr: string;
}

function playtest(args: string[], timeout = TEST_TIMEOUT_MS): Run {
  const result = spawnSync('npm', ['run', 'playtest', '--', ...args], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
    timeout,
  });
  const lines = result.stdout.split('\n');
  const start = lines.findIndex((line) => line !== '' && !line.startsWith('>'));
  return {
    status: result.status,
    stdout: start < 0 ? '' : lines.slice(start).join('\n'),
    stderr: result.stderr,
  };
}

function capture(argv: string[]) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) });
  return { code, out, err };
}

const lineOf = (text: string, label: string) =>
  text.split('\n').find((line) => line.startsWith(`${label}:`));

/** The Line-up line's bot entries (after "seat 1 plays the user") as [seat, name, style]. */
function bots(text: string): [number, string, string][] {
  const line = (lineOf(text, 'Line-up') ?? '').split('plays the user')[1] ?? '';
  return [...line.matchAll(/seat (\d+) (.+?) \(([^)]+)\)/g)].map((m) => [
    Number(m[1]),
    m[2] as string,
    m[3] as string,
  ]);
}

describe('playtest --lineup', () => {
  it(
    'AC#6 tough line-up at 9 players seats the Maniac at seat 2 and plays 10,000 clean hands',
    () => {
      const args = ['--hands', '10000', '--seed', '42', '--size', '9', '--lineup', 'tough'];
      const run = playtest(args);
      expect(run.status).toBe(0);
      expect(run.stdout).toContain('Options: --hands 10000 --seed 42 --size 9 --lineup tough\n');
      expect(run.stdout).toContain('Hands played: 10000\n');
      expect(run.stdout).toContain('Invariant violations: 0\n');
      expect(
        lineOf(run.stdout, 'Line-up')?.startsWith('Line-up: tough, seat 1 plays the user, '),
      ).toBe(true);
      const seated = bots(run.stdout);
      expect(seated.map(([seat, , style]) => [seat, style])).toEqual([
        [2, 'Maniac'],
        ...[3, 4, 5, 6, 7, 8, 9].map((seat) => [seat, 'TAG']),
      ]);
      expect(new Set(seated.map(([, name]) => name)).size).toBe(8);
      expect(lineOf(run.stdout, 'Line-up note')).toBeDefined();
      expect(playtest(args).stdout).toBe(run.stdout);
    },
    TEST_TIMEOUT_MS * 2,
  );

  it(
    'AC#7 an unknown line-up name prints the valid names and exits non-zero',
    () => {
      const usageLine = USAGE.split('\n')[0] as string;
      for (const value of ['loose', 'Tough', 'custom', '']) {
        const run = playtest(['--lineup', value]);
        expect(run.status).toBe(2);
        expect(run.stderr.startsWith('Error: --lineup must be mixed, tough or soft.')).toBe(true);
        for (const text of ['mixed', 'tough', 'soft', usageLine]) {
          expect(run.stderr).toContain(text);
        }
        expect(run.stdout).not.toContain('Hands played:');
      }
      const missing = playtest(['--lineup']);
      expect(missing.status).toBe(2);
      expect(missing.stderr.startsWith('Error: --lineup needs a value.')).toBe(true);
      expect(missing.stdout).not.toContain('Hands played:');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'each preset plays 200 clean 6-max hands',
    () => {
      const expected: Record<string, string[]> = {
        mixed: ['TAG', 'Calling station', 'Maniac', 'Rock', 'TAG'],
        tough: ['Maniac', 'TAG', 'TAG', 'TAG', 'TAG'],
        soft: ['Calling station', 'Rock', 'Calling station', 'Rock', 'Calling station'],
      };
      for (const [preset, styles] of Object.entries(expected)) {
        const run = capture(['--hands', '200', '--seed', '42', '--lineup', preset]);
        expect(run.code).toBe(0);
        expect(run.out).toContain('Invariant violations: 0\n');
        expect(bots(run.out).map(([seat, , style]) => [seat, style])).toEqual(
          styles.map((style, i) => [i + 2, style]),
        );
        expect(run.out).not.toContain('Line-up note:');
      }
    },
    TEST_TIMEOUT_MS,
  );

  it.runIf(SLOW)(
    'AC#8 10,000-hand Maniac line-ups stay practical (slow, opt-in)',
    () => {
      for (const preset of ['tough', 'mixed']) {
        const started = performance.now();
        const run = playtest(
          ['--hands', '10000', '--seed', '42', '--size', '6', '--lineup', preset],
          SLOW_RUN_LIMIT_MS,
        );
        const elapsed = performance.now() - started;
        console.log(`--lineup ${preset}: 10,000 hands in ${(elapsed / 1000).toFixed(1)} s`);
        expect(run.status).toBe(0);
        expect(run.stdout).toContain('Invariant violations: 0\n');
        expect(elapsed).toBeLessThan(SLOW_RUN_LIMIT_MS);
      }
    },
    SLOW_RUN_LIMIT_MS * 2 + 60_000,
  );
});
