import { describe, expect, it } from 'vitest';
import { main } from '../../src/playtest/cli';
import {
  MILLION_USAGE,
  combineShards,
  millionMain,
  parseMillionArgs,
  planShards,
  readShard,
  runShards,
  shardArgs,
  shardNodeArgs,
  type Shard,
  type ShardResult,
  type ShardRun,
  type ShardRunner,
} from '../../src/playtest/shards';

const PLAN_ERROR = 'Total hands must be a whole number from 9 to 1000000000';
const HANDS_ERROR = 'Error: --hands must be a whole number from 9 to 1000000000.';

/** The real CLI's report for a shard, in-process with default seams. */
function cliRun(shard: Shard, extra: string[] = []): ShardRun {
  let stdout = '';
  let stderr = '';
  const code = main([...shardArgs(shard), ...extra], {
    out: (t) => (stdout += t),
    err: (t) => (stderr += t),
  });
  return { code, stdout, stderr };
}

const cleanRunner: ShardRunner = (shard) => Promise.resolve(cliRun(shard));

async function capture(argv: string[], runner: ShardRunner, concurrency = 4) {
  let out = '';
  let err = '';
  const code = await millionMain(
    argv,
    { out: (t) => (out += t), err: (t) => (err += t) },
    runner,
    concurrency,
  );
  return { code, out, err, lines: out.split('\n') };
}

/** Runs `--hands 9` with shard 4 replaced by `run4`. */
const withShard4 = (run4: () => Promise<ShardRun>) =>
  capture(['--hands', '9'], (shard) => (shard.index === 4 ? run4() : cleanRunner(shard)));

describe('Shards', () => {
  it('plan, arguments and concurrency', async () => {
    expect(planShards(10).map((s) => s.hands)).toEqual([2, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(planShards(900).map((s) => s.hands)).toEqual(Array<number>(9).fill(100));
    for (const bad of [8, 9.5, 1_000_000_001, Number.NaN]) {
      expect(() => planShards(bad)).toThrow(new RangeError(PLAN_ERROR));
    }
    expect(planShards(1_000_000_000).reduce((sum, s) => sum + s.hands, 0)).toBe(1_000_000_000);

    expect(parseMillionArgs([])).toEqual({ kind: 'run', hands: 1_000_000 });
    expect(parseMillionArgs(['--hands', '9'])).toEqual({ kind: 'run', hands: 9 });
    expect(parseMillionArgs(['--hands', '1000000000'])).toEqual({
      kind: 'run',
      hands: 1_000_000_000,
    });
    for (const value of ['8', '1e6', '-5', '1000000001', '', ' 9']) {
      expect(parseMillionArgs(['--hands', value])).toEqual({ kind: 'error', message: HANDS_ERROR });
    }
    const error = (message: string) => ({ kind: 'error', message });
    expect(parseMillionArgs(['--seed', '1'])).toEqual(error('Error: unknown option.'));
    expect(parseMillionArgs(['--hands'])).toEqual(error('Error: --hands needs a value.'));
    expect(parseMillionArgs(['--hands', '--help'])).toEqual(error('Error: --hands needs a value.'));
    expect(parseMillionArgs(['--hands', '9', '--hands', '10'])).toEqual(
      error('Error: --hands given more than once.'),
    );
    expect(parseMillionArgs(['--help', '--hands', '9'])).toEqual(
      error('Error: --help cannot be combined with other options.'),
    );
    expect(parseMillionArgs(['--help', '--help'])).toEqual(
      error('Error: --help given more than once.'),
    );
    expect(parseMillionArgs(['--help'])).toEqual({ kind: 'help' });

    const neverCalled: ShardRunner = () => {
      throw new Error('runner called');
    };
    expect(await capture(['--help'], neverCalled)).toMatchObject({
      code: 0,
      out: MILLION_USAGE,
      err: '',
    });
    expect(await capture(['--hands', '8'], neverCalled)).toMatchObject({
      code: 2,
      out: '',
      err: `${HANDS_ERROR}\n${MILLION_USAGE}`,
    });

    const plan = planShards(9);
    const started: number[] = [];
    const pending: { index: number; settle: () => void }[] = [];
    let maxPending = 0;
    const runner: ShardRunner = (shard) =>
      new Promise((resolve) => {
        started.push(shard.index);
        pending.push({ index: shard.index, settle: () => resolve(cliRun(shard)) });
        maxPending = Math.max(maxPending, pending.length);
      });
    const running = runShards(plan, runner, 2);
    // Settle the newest pending call first, so shards finish in reverse order of starting.
    while (started.length < plan.length || pending.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      pending.pop()?.settle();
    }
    const results = await running;
    expect(maxPending).toBeLessThanOrEqual(2);
    expect(started).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(results.map((r) => r.shard.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(results.every((r) => r.passed)).toBe(true);

    let wide = 0;
    let open = 0;
    await runShards(
      plan,
      (shard) => {
        open++;
        wide = Math.max(wide, open);
        return Promise.resolve().then(() => {
          open--;
          return cliRun(shard);
        });
      },
      20,
    );
    expect(wide).toBe(9);

    for (const bad of [0, 1.5, -1]) {
      await expect(runShards(plan, cleanRunner, bad)).rejects.toThrow(
        new RangeError('Concurrency must be a whole number of at least 1'),
      );
    }

    expect(shardNodeArgs({ index: 5, size: 6, hands: 111111, seed: 1000006 })).toEqual([
      '--import',
      './tools/playtest/resolve-ts.js',
      'tools/playtest/main.ts',
      '--hands',
      '111111',
      '--seed',
      '1000006',
      '--size',
      '6',
    ]);
  });

  it('a failed or mismatched shard fails the run', async () => {
    const crashed = await withShard4(() =>
      Promise.resolve({ code: null, stdout: '', stderr: 'boom' }),
    );
    expect(crashed.code).toBe(1);
    expect(crashed.err).toBe('');
    const after4 = crashed.lines.indexOf(
      'Shard 4 of 9: npm run playtest -- --hands 1 --seed 1000005 --size 5',
    );
    expect(crashed.lines.slice(after4 + 1, after4 + 4)).toEqual([
      'Shard 4 failed: stopped before finishing',
      'Shard 4 stderr:',
      'boom',
    ]);
    expect(crashed.lines.slice(crashed.lines.indexOf('Combined report'))).toEqual([
      'Combined report',
      'Shards passed: 8 of 9',
      'Hands played: 8',
      'Invariant violations: 0',
      'Violations by invariant: chips 0, legal-action 0, bet-cap 0, pot-eligibility 0, cards 0',
      'Result: FAIL',
      '',
    ]);

    const rejected = await withShard4(() => Promise.reject(new Error('spawn failed')));
    expect(rejected.code).toBe(1);
    expect(rejected.lines).toContain('Shard 4 failed: stopped before finishing');
    expect(rejected.lines).toContain('Error: spawn failed');
    expect(rejected.lines).toContain('Shards passed: 8 of 9');

    const thrown = await capture(['--hands', '9'], (shard) => {
      if (shard.index === 4) throw new Error('sync failure');
      return cleanRunner(shard);
    });
    expect(thrown.lines).toContain('Shard 4 failed: stopped before finishing');
    expect(thrown.lines).toContain('Error: sync failure');

    const exit3 = await withShard4(() =>
      Promise.resolve({ code: 3, stdout: 'partial', stderr: '' }),
    );
    expect(exit3.code).toBe(1);
    expect(exit3.out).toContain('partial\nShard 4 failed: exit code 3\nShard 5 of 9: ');
    expect(exit3.lines).not.toContain('Shard 4 stderr:');

    const shard: Shard = planShards(9)[3] as Shard;
    const clean = cliRun(shard);
    const mismatch = 'report does not match the shard plan';
    const problem = (run: ShardRun) => readShard(shard, run).problem;
    expect(readShard(shard, clean)).toMatchObject({
      passed: true,
      handsPlayed: 1,
      violations: 0,
      problem: null,
      violationCounts: {
        chips: 0,
        'legal-action': 0,
        'bet-cap': 0,
        'pot-eligibility': 0,
        cards: 0,
      },
    });
    expect(problem(cliRun(shard, ['--game', 'sng']))).toBe(mismatch);
    expect(
      problem({ ...clean, stdout: clean.stdout.replace('Hands played: 1\n', 'Hands played: 2\n') }),
    ).toBe(mismatch);
    expect(
      problem({
        ...clean,
        stdout: clean.stdout.replace('Invariant violations: 0\n', 'Invariant violations: 1\n'),
      }),
    ).toBe(mismatch);
    expect(
      problem({
        ...clean,
        stdout: clean.stdout.replace('Invariant violations: 0\n', 'Invariant violations: x\n'),
      }),
    ).toBe(mismatch);
    expect(problem({ ...clean, stdout: `${clean.stdout}${clean.stdout}` })).toBe(mismatch);
    expect(problem({ ...clean, code: 1 })).toBe(mismatch);
    const violating = {
      code: 1,
      stdout: clean.stdout.replace('Invariant violations: 0\n', 'Invariant violations: 1\n'),
      stderr: '',
    };
    expect(problem(violating)).toBe(mismatch);
    expect(
      problem({ ...violating, stdout: `${violating.stdout}Violations by invariant: chips one\n` }),
    ).toBe(mismatch);
    expect(
      readShard(shard, {
        ...violating,
        stdout: `${violating.stdout}Violations by invariant: chips 1, constructor 2\n`,
      }),
    ).toMatchObject({
      passed: false,
      problem: null,
      violations: 1,
      handsPlayed: 1,
      violationCounts: { chips: 1, constructor: 2 },
    });
    expect(problem({ code: 0, stdout: '', stderr: '' })).toBe(mismatch);
  });

  it('sums the same invariant across shards', () => {
    const [first, second] = planShards(9) as [Shard, Shard];
    const failing = (shard: Shard, chips: number): ShardResult => ({
      shard,
      run: { code: 1, stdout: '', stderr: '' },
      passed: false,
      handsPlayed: 1,
      violations: chips,
      violationCounts: { chips },
      problem: null,
    });
    const combined = combineShards([failing(first, 2), failing(second, 3)]);
    expect(combined.violationCounts.chips).toBe(5);
    expect(combined.violations).toBe(5);
  });
});
