import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { main } from '../../src/playtest/cli';
import { runPlaytest } from '../../src/playtest/runner';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;

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

const lineValue = (text: string, label: string) =>
  text
    .split('\n')
    .find((line) => line.startsWith(`${label}: `))
    ?.slice(label.length + 2);

const REPORT_LABELS = [
  'Options',
  'Table',
  'Hands played',
  'Ended by fold',
  'Ended at showdown',
  'Player actions',
  'Streets capped at 4 bets',
  'Largest pot',
  'First replay code',
  'Last replay code',
  'Invariant violations',
];

const BAD_CODE_MESSAGE =
  'Error: --replay-code must be 32 lowercase hex characters (0-9, a-f), not all zeros.\n';

describe('npm run playtest', () => {
  it(
    'AC#1 plays 10,000 hands at 6-max $4/$8 and reports zero violations',
    () => {
      const run = playtest(['--hands', '10000', '--seed', '42'], 60_000);
      expect(run.status).toBe(0);
      const lines = run.stdout.split('\n');
      expect(lines[0]).toBe('TLH Trainer playtest');
      expect(lines).toContain('Options: --hands 10000 --seed 42 --size 6');
      expect(lines).toContain(
        'Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160',
      );
      expect(lines).toContain('Hands played: 10000');
      expect(lines).toContain('Invariant violations: 0');
      const order = REPORT_LABELS.map((label) =>
        lines.findIndex((line) => line.startsWith(`${label}: `)),
      );
      expect(order.every((index) => index > 0)).toBe(true);
      expect(order).toEqual([...order].sort((a, b) => a - b));
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#3 same seed and options give byte-identical output',
    () => {
      for (const args of [
        ['--hands', '2000', '--seed', '42', '--size', '9'],
        ['--hands', '10000', '--seed', '42'],
      ]) {
        const first = playtest(args);
        const second = playtest(args);
        expect(first.status).toBe(0);
        expect(second.status).toBe(0);
        expect(first.stdout).toContain('Hands played: ');
        expect(second.stdout === first.stdout).toBe(true);
      }
      const argv = ['--hands', '500', '--seed', '9', '--size', '7'];
      expect(capture(argv)).toEqual(capture(argv));
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#4 seeds 42 and 43 deal different replay codes',
    () => {
      const run42 = playtest(['--hands', '100', '--seed', '42']);
      const run43 = playtest(['--hands', '100', '--seed', '43']);
      expect(run42.status).toBe(0);
      expect(run43.status).toBe(0);
      expect(lineValue(run42.stdout, 'First replay code')).toBe('000000000000002a0000000000000001');
      expect(lineValue(run42.stdout, 'Last replay code')).toBe('000000000000002a0000000000000064');
      expect(lineValue(run43.stdout, 'First replay code')).toBe('000000000000002b0000000000000001');
      expect(lineValue(run43.stdout, 'Last replay code')).toBe('000000000000002b0000000000000064');

      const codes = (seed: number) => {
        const seen = new Set<string>();
        runPlaytest({ hands: 100, seed, size: 6 }, (hand) => seen.add(hand.record.replayCode));
        return seen;
      };
      const codes42 = codes(42);
      const codes43 = codes(43);
      expect(codes42.size).toBe(100);
      expect(codes43.size).toBe(100);
      expect([...codes42].filter((code) => codes43.has(code))).toEqual([]);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#7 invalid replay code prints the fixed usage message and exits 2',
    () => {
      const uppercase = 'ABCDEF0123456789abcdef0123456789';
      const spawned = playtest(['--replay-code', uppercase]);
      expect(spawned.status).toBe(2);
      expect(spawned.stdout).not.toContain('Hands played:');
      expect(spawned.stderr).toContain(BAD_CODE_MESSAGE);
      expect(spawned.stderr).toContain('Usage: npm run playtest --');
      expect(spawned.stderr).not.toContain(uppercase);

      const usage = capture(['--help']).out;
      const badValues = [
        uppercase,
        'abcdef0123456789abcdef012345678',
        'abcdef0123456789abcdef01234567890',
        '00000000000000000000000000000000',
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      ];
      for (const value of badValues) {
        const result = capture(['--replay-code', value]);
        expect(result.code).toBe(2);
        expect(result.out).toBe('');
        expect(result.err).toBe(BAD_CODE_MESSAGE + usage);
        expect(result.err).not.toContain(value);
      }
      const missing = capture(['--replay-code']);
      expect(missing.code).toBe(2);
      expect(missing.out).toBe('');
      expect(missing.err).toBe('Error: --replay-code needs a value.\n' + usage);
    },
    TEST_TIMEOUT_MS,
  );
});
