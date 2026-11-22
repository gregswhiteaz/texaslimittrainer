import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { Violation } from '../../src/engine/invariants';
import { main } from '../../src/playtest/cli';
import type { PlaytestSeams } from '../../src/playtest/runner';
import {
  millionMain,
  planLineUpShards,
  shardArgs,
  type Shard,
  type ShardRunner,
} from '../../src/playtest/shards';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;
const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const PRESETS = ['mixed', 'tough', 'soft'] as const;

interface Run {
  status: number | null;
  /** stdout without npm's `> name@version script` header lines. */
  stdout: string;
  stderr: string;
}

function npmRun(script: string, args: string[]): Run {
  const result = spawnSync('npm', ['run', script, '--', ...args], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
    timeout: TEST_TIMEOUT_MS,
  });
  const lines = result.stdout.split('\n');
  const start = lines.findIndex((line) => line !== '' && !line.startsWith('>'));
  return {
    status: result.status,
    stdout: start < 0 ? '' : lines.slice(start).join('\n'),
    stderr: result.stderr,
  };
}

/** A runner that builds each shard's report in-process with `main`, with the given seams per shard index. */
function inProcessRunner(seamsFor: (shard: Shard) => PlaytestSeams | undefined): ShardRunner {
  return (shard) => {
    let stdout = '';
    let stderr = '';
    const io = { out: (t: string) => (stdout += t), err: (t: string) => (stderr += t) };
    const code = main(shardArgs(shard), io, seamsFor(shard));
    return Promise.resolve({ code, stdout, stderr });
  };
}

/** The lines of a shard's section: after its `Shard i of 27:` header, before the next header or the combined report. */
function shardSection(report: string, index: number): string {
  const start = report.indexOf(`Shard ${index} of 27: `);
  const body = report.indexOf('\n', start) + 1;
  const end =
    index < 27 ? report.indexOf(`Shard ${index + 1} of 27: `) : report.indexOf('Combined report\n');
  return report.slice(body, end);
}

const handsLine = (preset: string, hands: (size: number) => number) =>
  `Hands for line-up ${preset}: ${SIZES.map((size) => `size ${size} ${hands(size)}`).join(', ')}`;

const expectedHeaders = (hands: number) =>
  PRESETS.flatMap((preset, p) =>
    SIZES.map(
      (size, i) =>
        `Shard ${9 * p + i + 1} of 27: npm run playtest -- --hands ${hands} --seed ${1_000_000 + 100 * (p + 1) + size} --size ${size} --lineup ${preset}`,
    ),
  );

describe('Million-hand line-up playtest', () => {
  it(
    'an on-demand line-up run plays Mixed, Tough and Soft at every table size 2 to 10 and reports zero violations',
    async () => {
      const plan = planLineUpShards(1_000_000);
      expect(plan.map((s) => s.lineUp)).toEqual(PRESETS.flatMap((p) => Array<string>(9).fill(p)));
      expect(plan.map((s) => s.size)).toEqual([...SIZES, ...SIZES, ...SIZES]);
      expect(plan.map((s) => s.hands)).toEqual([37038, ...Array<number>(26).fill(37037)]);
      expect(plan.reduce((sum, s) => sum + s.hands, 0)).toBe(1_000_000);
      expect(plan.map((s) => s.seed)).toEqual(
        PRESETS.flatMap((_, p) => SIZES.map((size) => 1_000_000 + 100 * (p + 1) + size)),
      );
      expect(plan.map((s) => s.index)).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));

      const run = npmRun('playtest:million', ['--lineups', '--hands', '270']);
      expect(run.status).toBe(0);
      const lines = run.stdout.split('\n');
      expect(lines.filter((line) => /^Shard [0-9]+ of 27: /.test(line))).toEqual(
        expectedHeaders(10),
      );
      for (let index = 1; index <= 27; index++) {
        const section = shardSection(run.stdout, index).split('\n');
        expect(section).toContain('Invariant violations: 0');
        expect(section.some((line) => /^Bots replaced: [0-9]+$/.test(line))).toBe(true);
      }
      expect(lines.slice(lines.indexOf('Combined report'))).toEqual([
        'Combined report',
        'Shards passed: 27 of 27',
        'Hands played: 270',
        ...PRESETS.map((preset) => handsLine(preset, () => 10)),
        'Invariant violations: 0',
        'Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0',
        'Result: PASS',
        '',
      ]);

      const forced: PlaytestSeams = {
        onAction: (): Violation[] => [{ invariant: 'chips', message: 'forced' }],
      };
      let out = '';
      let err = '';
      const code = await millionMain(
        ['--lineups', '--hands', '270'],
        { out: (t) => (out += t), err: (t) => (err += t) },
        inProcessRunner((shard) => (shard.index === 14 ? forced : undefined)),
        4,
      );
      expect(code).toBe(1);
      expect(err).toBe('');
      const forcedLines = out.split('\n');
      expect(forcedLines).toContain('Shards passed: 26 of 27');
      expect(forcedLines).toContain(handsLine('tough', () => 10));
      expect(forcedLines).toContain('Result: FAIL');
      const replay = shardSection(out, 14)
        .split('\n')
        .find((line) => line.startsWith('Replay: '));
      expect(replay).toMatch(
        /^Replay: npm run playtest -- --replay-code [0-9a-f]{32} .*--lineup tough/,
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    're-running a line-up shard with its seed gives byte-identical output',
    () => {
      const shardArgv = [
        '--hands',
        '2000',
        '--seed',
        '1000206',
        '--size',
        '6',
        '--lineup',
        'tough',
      ];
      const first = npmRun('playtest', shardArgv);
      const second = npmRun('playtest', shardArgv);
      expect(first.status).toBe(0);
      expect(second.status).toBe(0);
      expect(second.stdout).toBe(first.stdout);

      const million = npmRun('playtest:million', ['--lineups', '--hands', '270']);
      const again = npmRun('playtest:million', ['--lineups', '--hands', '270']);
      expect(million.status).toBe(0);
      expect(again.stdout).toBe(million.stdout);
      expect(million.stdout).toContain(`${expectedHeaders(10)[13]}\n`);
      const direct = npmRun('playtest', [
        '--hands',
        '10',
        '--seed',
        '1000206',
        '--size',
        '6',
        '--lineup',
        'tough',
      ]);
      expect(direct.status).toBe(0);
      expect(shardSection(million.stdout, 14)).toBe(direct.stdout);
    },
    TEST_TIMEOUT_MS,
  );
});
