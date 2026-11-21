import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { Violation } from '../../src/engine/invariants';
import { main } from '../../src/playtest/cli';
import type { PlaytestSeams } from '../../src/playtest/runner';
import {
  combineShards,
  formatMillionReport,
  millionMain,
  planShards,
  readShard,
  runShards,
  shardArgs,
  shardNodeArgs,
  type Shard,
  type ShardRunner,
} from '../../src/playtest/shards';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;
const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

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

async function capture(argv: string[], runner: ShardRunner, concurrency: number) {
  let out = '';
  let err = '';
  const code = await millionMain(
    argv,
    { out: (t) => (out += t), err: (t) => (err += t) },
    runner,
    concurrency,
  );
  return { code, out, err };
}

/** The lines of a shard's section: after its `Shard i of 9:` header, before the next header or the combined report. */
function shardSection(report: string, index: number): string {
  const start = report.indexOf(`Shard ${index} of 9: `);
  const body = report.indexOf('\n', start) + 1;
  const end =
    index < 9 ? report.indexOf(`Shard ${index + 1} of 9: `) : report.indexOf('Combined report\n');
  return report.slice(body, end);
}

describe('Million-hand playtest', () => {
  it(
    'an on-demand run spreads cash hands over table sizes 2 to 10 and reports zero violations',
    () => {
      const plan = planShards(1_000_000);
      expect(plan.map((s) => s.size)).toEqual(SIZES);
      expect(plan.map((s) => s.hands)).toEqual([111112, ...Array<number>(8).fill(111111)]);
      expect(plan.reduce((sum, s) => sum + s.hands, 0)).toBe(1_000_000);
      expect(plan.map((s) => s.seed)).toEqual(SIZES.map((size) => 1_000_000 + size));
      expect(plan.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      const run = npmRun('playtest:million', ['--hands', '900']);
      expect(run.status).toBe(0);
      const lines = run.stdout.split('\n');
      const headers = lines.filter((line) => /^Shard [0-9]+ of 9: /.test(line));
      expect(headers).toEqual(
        SIZES.map(
          (size, i) =>
            `Shard ${i + 1} of 9: npm run playtest -- --hands 100 --seed ${1_000_000 + size} --size ${size}`,
        ),
      );
      const combined = lines.slice(lines.indexOf('Combined report'));
      expect(combined).toEqual([
        'Combined report',
        'Shards passed: 9 of 9',
        'Hands played: 900',
        'Invariant violations: 0',
        'Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0',
        'Result: PASS',
        '',
      ]);
    },
    TEST_TIMEOUT_MS,
  );

  it("a shard violation fails the run and prints that shard's replay code and action history", async () => {
    const forced: PlaytestSeams = {
      onAction: (): Violation[] => [{ invariant: 'chips', message: 'forced' }],
    };
    const run = await capture(
      ['--hands', '18'],
      inProcessRunner((shard) => (shard.index === 1 ? forced : undefined)),
      3,
    );
    expect(run.code).toBe(1);
    expect(run.err).toBe('');
    const lines = run.out.split('\n');
    const header = lines.indexOf(
      'Shard 1 of 9: npm run playtest -- --hands 2 --seed 1000002 --size 2',
    );
    expect(header).toBeGreaterThan(-1);
    const section = shardSection(run.out, 1);
    const direct = inProcessRunner(() => forced)({ index: 1, size: 2, hands: 2, seed: 1000002 });
    expect(section).toBe((await direct).stdout);
    const sectionLines = section.split('\n');
    const replay = sectionLines.find((line) => line.startsWith('Replay: '));
    expect(replay).toMatch(/^Replay: npm run playtest -- --replay-code [0-9a-f]{32} /);
    const code = /--replay-code ([0-9a-f]{32})/.exec(replay ?? '')?.[1];
    expect(sectionLines).toContain(`Hand 1: replay code ${code}, button seat 1`);
    expect(sectionLines.some((line) => line.startsWith('Preflop: '))).toBe(true);
    expect(lines.slice(lines.indexOf('Combined report'))).toEqual([
      'Combined report',
      'Shards passed: 8 of 9',
      'Hands played: 18',
      'Invariant violations: 2',
      'Violations by invariant: chips 2, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0',
      'Result: FAIL',
      '',
    ]);
  });

  it(
    're-running a shard with the same seed and options gives byte-identical output',
    () => {
      const shardArgv = ['--hands', '2000', '--seed', '1000009', '--size', '9'];
      const first = npmRun('playtest', shardArgv);
      const second = npmRun('playtest', shardArgv);
      expect(first.status).toBe(0);
      expect(second.status).toBe(0);
      expect(second.stdout).toBe(first.stdout);

      const million = npmRun('playtest:million', ['--hands', '900']);
      const again = npmRun('playtest:million', ['--hands', '900']);
      expect(million.status).toBe(0);
      expect(again.stdout).toBe(million.stdout);
      expect(million.stdout).toContain(
        'Shard 8 of 9: npm run playtest -- --hands 100 --seed 1000009 --size 9\n',
      );
      const direct = npmRun('playtest', ['--hands', '100', '--seed', '1000009', '--size', '9']);
      expect(direct.status).toBe(0);
      expect(shardSection(million.stdout, 8)).toBe(direct.stdout);
    },
    TEST_TIMEOUT_MS,
  );

  it('combined violation counts are summed per invariant across shards that each use the default checker', async () => {
    let calls = 0;
    const seams: Record<number, PlaytestSeams> = {
      1: { onAction: () => [{ invariant: 'chips', message: 'forced' }] },
      2: {
        onAction: () => {
          calls++;
          if (calls === 1) return [{ invariant: 'bet-cap', message: 'forced' }];
          if (calls === 2) {
            return [
              { invariant: 'bet-cap', message: 'forced' },
              { invariant: 'x-test', message: 'forced' },
            ];
          }
          return [];
        },
      },
    };
    const plan = planShards(27);
    const results = await runShards(
      plan,
      inProcessRunner((shard) => seams[shard.index]),
      1,
    );
    expect(results[0]?.run.stdout).toContain(
      'Violations by invariant: chips 3, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0\n',
    );
    expect(results[1]?.run.stdout).toContain(
      'Violations by invariant: chips 0, legal-action 0, bet-cap 2, pot-eligibility 0, cards 0, x-test 1\n',
    );
    expect(results.map((r) => r.problem)).toEqual(Array<null>(9).fill(null));

    const combined = combineShards(results);
    expect(Object.entries(combined.violationCounts)).toEqual([
      ['chips', 3],
      ['legal-action', 0],
      ['bet-cap', 2],
      ['pot-eligibility', 0],
      ['cards', 0],
      ['x-test', 1],
    ]);
    expect(combined).toMatchObject({ shards: 9, passed: 7, handsPlayed: 27, violations: 6 });
    expect(formatMillionReport(27, results).split('\n')).toContain(
      'Violations by invariant: chips 3, legal-action 0, bet-cap 2, pot-eligibility 0, cards 0, x-test 1',
    );

    for (const shard of plan) {
      expect(shardNodeArgs(shard)).toEqual([
        '--import',
        './tools/playtest/resolve-ts.js',
        'tools/playtest/main.ts',
        '--hands',
        String(shard.hands),
        '--seed',
        String(shard.seed),
        '--size',
        String(shard.size),
      ]);
    }

    const shard = plan[0] as Shard;
    let sng = '';
    let sngErr = '';
    const sngCode = main([...shardArgs(shard), '--game', 'sng'], {
      out: (t) => (sng += t),
      err: (t) => (sngErr += t),
    });
    expect(sng).toContain(' --game sng\n');
    expect(readShard(shard, { code: sngCode, stdout: sng, stderr: sngErr }).problem).toBe(
      'report does not match the shard plan',
    );
  });
});
