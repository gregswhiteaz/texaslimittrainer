// The 1,000,000-hand sharded playtest (TASK-1.17): one `npm run playtest` child per table size, combined.
// With --lineups (TASK-6.9): one child per line-up preset and table size.
import { INVARIANTS } from '../engine/invariants';
import type { CliIo } from './cli';

export const MILLION_HANDS = 1_000_000;
export const SHARD_SIZES: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SHARD_SEED_BASE = 1_000_000;
const MAX_HANDS = 1_000_000_000;
export type ShardLineUp = 'mixed' | 'tough' | 'soft';
export const LINEUP_SHARD_PRESETS: readonly ShardLineUp[] = ['mixed', 'tough', 'soft'];
const LINEUP_SHARDS = LINEUP_SHARD_PRESETS.length * SHARD_SIZES.length;

export interface Shard {
  /** 1-based. */
  readonly index: number;
  readonly size: number;
  readonly hands: number;
  readonly seed: number;
  /** Line-up shards only: passed as `--lineup <name>`. */
  readonly lineUp?: ShardLineUp;
}
export interface ShardRun {
  /** null when the child was killed or never started. */
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}
export type ShardRunner = (shard: Shard) => Promise<ShardRun>;
export interface ShardResult {
  readonly shard: Shard;
  readonly run: ShardRun;
  readonly passed: boolean;
  readonly handsPlayed: number;
  readonly violations: number;
  readonly violationCounts: Readonly<Record<string, number>>;
  readonly problem: string | null;
}
export interface CombinedReport {
  readonly shards: number;
  readonly passed: number;
  readonly handsPlayed: number;
  readonly violations: number;
  readonly violationCounts: Readonly<Record<string, number>>;
}
export type MillionArgs =
  | { readonly kind: 'run'; readonly hands: number; readonly lineUps: boolean }
  | { readonly kind: 'help' }
  | { readonly kind: 'error'; readonly message: string };

export const MILLION_USAGE =
  'Usage: npm run playtest:million -- [--hands <9-1000000000>] [--lineups]\n' +
  'Defaults: --hands 1000000; cash hands spread over table sizes 2 to 10, one shard per size with seed 1000000 + size\n' +
  '--lineups: cash hands spread over line-ups mixed, tough and soft at table sizes 2 to 10, one shard per line-up and size (27 or more hands)\n';

/** Leftover hands go one each to the smallest table sizes first (A-2). */
export function planShards(totalHands: number): Shard[] {
  if (!Number.isInteger(totalHands) || totalHands < SHARD_SIZES.length || totalHands > MAX_HANDS) {
    throw new RangeError('Total hands must be a whole number from 9 to 1000000000');
  }
  const base = Math.floor(totalHands / SHARD_SIZES.length);
  const extra = totalHands % SHARD_SIZES.length;
  return SHARD_SIZES.map((size, i) => ({
    index: i + 1,
    size,
    hands: base + (i < extra ? 1 : 0),
    seed: SHARD_SEED_BASE + size,
  }));
}

/** Preset-major (mixed 2..10, tough, soft); seed 1000000 + 100 × (preset position + 1) + size (A-1); leftover hands
 *  go one each to the earliest shards (A-2). */
export function planLineUpShards(totalHands: number): Shard[] {
  if (!Number.isInteger(totalHands) || totalHands < LINEUP_SHARDS || totalHands > MAX_HANDS) {
    throw new RangeError('Total hands must be a whole number from 27 to 1000000000');
  }
  const base = Math.floor(totalHands / LINEUP_SHARDS);
  const extra = totalHands % LINEUP_SHARDS;
  return LINEUP_SHARD_PRESETS.flatMap((lineUp, p) =>
    SHARD_SIZES.map((size, i) => {
      const index = p * SHARD_SIZES.length + i + 1;
      return {
        index,
        size,
        hands: base + (index <= extra ? 1 : 0),
        seed: SHARD_SEED_BASE + 100 * (p + 1) + size,
        lineUp,
      };
    }),
  );
}

export function shardArgs(shard: Shard): string[] {
  const args = [
    '--hands',
    String(shard.hands),
    '--seed',
    String(shard.seed),
    '--size',
    String(shard.size),
  ];
  return shard.lineUp === undefined ? args : [...args, '--lineup', shard.lineUp];
}

/** The `npm run playtest` entry, which passes no seams, so every shard uses the default checker. */
export function shardNodeArgs(shard: Shard): string[] {
  return [
    '--import',
    './tools/playtest/resolve-ts.js',
    'tools/playtest/main.ts',
    ...shardArgs(shard),
  ];
}

const PAIR = /^([a-z0-9-]+) ([0-9]+)$/;

/** The id → count pairs of a `Violations by invariant: ` line, or undefined if malformed. */
function parseCounts(text: string): Record<string, number> | undefined {
  const counts: Record<string, number> = {};
  for (const pair of text.split(', ')) {
    const match = PAIR.exec(pair);
    if (match === null) return undefined;
    counts[match[1] as string] = Number(match[2]);
  }
  return counts;
}

function checkReport(
  shard: Shard,
  run: ShardRun,
): { violations: number; counts: Record<string, number> } | string {
  if (run.code === null) return 'stopped before finishing';
  if (run.code !== 0 && run.code !== 1) return `exit code ${run.code}`;
  const mismatch = 'report does not match the shard plan';
  const lines = run.stdout.split('\n');
  const options = `Options: ${shardArgs(shard).join(' ')}`;
  if (lines.filter((line) => line === options).length !== 1) return mismatch;
  if (!lines.includes(`Hands played: ${shard.hands}`)) return mismatch;
  const violationsText = lines
    .find((line) => line.startsWith('Invariant violations: '))
    ?.slice('Invariant violations: '.length);
  if (violationsText === undefined || !/^[0-9]+$/.test(violationsText)) return mismatch;
  const violations = Number(violationsText);
  if ((run.code === 0) !== (violations === 0)) return mismatch;
  const countsText = lines
    .find((line) => line.startsWith('Violations by invariant: '))
    ?.slice('Violations by invariant: '.length);
  if (countsText === undefined) {
    if (violations > 0) return mismatch;
    return { violations, counts: Object.fromEntries(INVARIANTS.map((id) => [id, 0])) };
  }
  const counts = parseCounts(countsText);
  return counts === undefined ? mismatch : { violations, counts };
}

export function readShard(shard: Shard, run: ShardRun): ShardResult {
  const checked = checkReport(shard, run);
  if (typeof checked === 'string') {
    return {
      shard,
      run,
      passed: false,
      handsPlayed: 0,
      violations: 0,
      violationCounts: {},
      problem: checked,
    };
  }
  return {
    shard,
    run,
    passed: checked.violations === 0,
    handsPlayed: shard.hands,
    violations: checked.violations,
    violationCounts: checked.counts,
    problem: null,
  };
}

/** Counts keyed by every INVARIANTS id, then custom ids in first-seen order. */
export function combineShards(results: readonly ShardResult[]): CombinedReport {
  const violationCounts: Record<string, number> = Object.fromEntries(
    INVARIANTS.map((id) => [id, 0]),
  );
  for (const result of results) {
    for (const [id, count] of Object.entries(result.violationCounts)) {
      const before = Object.hasOwn(violationCounts, id) ? violationCounts[id] : undefined;
      violationCounts[id] = (before ?? 0) + count;
    }
  }
  return {
    shards: results.length,
    passed: results.filter((result) => result.passed).length,
    handsPlayed: results.reduce((sum, result) => sum + result.handsPlayed, 0),
    violations: results.reduce((sum, result) => sum + result.violations, 0),
    violationCounts,
  };
}

const withNewline = (text: string) => (text === '' || text.endsWith('\n') ? text : `${text}\n`);

export function formatMillionReport(totalHands: number, results: readonly ShardResult[]): string {
  const total = results.length;
  const lineUps = results.some(({ shard }) => shard.lineUp !== undefined);
  const over = lineUps
    ? 'line-ups mixed, tough and soft at table sizes 2 to 10'
    : 'table sizes 2 to 10';
  let text =
    'TLH Trainer million-hand playtest\n' +
    `Plan: ${totalHands} cash hands over ${over} in ${total} shards, one seed per shard\n`;
  for (const { shard, run, problem } of results) {
    text += `Shard ${shard.index} of ${total}: npm run playtest -- ${shardArgs(shard).join(' ')}\n`;
    text += withNewline(run.stdout);
    if (problem !== null) {
      text += `Shard ${shard.index} failed: ${problem}\n`;
      if (run.stderr !== '') text += `Shard ${shard.index} stderr:\n${withNewline(run.stderr)}`;
    }
  }
  const combined = combineShards(results);
  const counts = Object.entries(combined.violationCounts)
    .map(([id, count]) => `${id} ${count}`)
    .join(', ');
  return (
    text +
    [
      'Combined report',
      `Shards passed: ${combined.passed} of ${combined.shards}`,
      `Hands played: ${combined.handsPlayed}`,
      ...(lineUps ? LINEUP_SHARD_PRESETS.map((lineUp) => lineUpHands(lineUp, results)) : []),
      `Invariant violations: ${combined.violations}`,
      `Violations by invariant: ${counts}`,
      `Result: ${combined.passed === combined.shards ? 'PASS' : 'FAIL'}`,
    ]
      .map((line) => `${line}\n`)
      .join('')
  );
}

function lineUpHands(lineUp: ShardLineUp, results: readonly ShardResult[]): string {
  const cells = results
    .filter(({ shard }) => shard.lineUp === lineUp)
    .map(({ shard, handsPlayed }) => `size ${shard.size} ${handsPlayed}`);
  return `Hands for line-up ${lineUp}: ${cells.join(', ')}`;
}

/** Runs at most `concurrency` shards at a time, starting them in index order; results in shard order. */
export async function runShards(
  shards: readonly Shard[],
  runShard: ShardRunner,
  concurrency: number,
): Promise<ShardResult[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('Concurrency must be a whole number of at least 1');
  }
  const results: ShardResult[] = [];
  let next = 0;
  const worker = async () => {
    while (next < shards.length) {
      const position = next++;
      const shard = shards[position] as Shard;
      let run: ShardRun;
      try {
        run = await runShard(shard);
      } catch (reason) {
        run = { code: null, stdout: '', stderr: String(reason) };
      }
      results[position] = readShard(shard, run);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, shards.length) }, worker));
  return results;
}

export function parseMillionArgs(argv: readonly string[]): MillionArgs {
  let help = false;
  let lineUps = false;
  let hands: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i];
    if (name === '--help') {
      if (help) return { kind: 'error', message: 'Error: --help given more than once.' };
      help = true;
      continue;
    }
    if (name === '--lineups') {
      if (lineUps) return { kind: 'error', message: 'Error: --lineups given more than once.' };
      lineUps = true;
      continue;
    }
    if (name !== '--hands') return { kind: 'error', message: 'Error: unknown option.' };
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      return { kind: 'error', message: 'Error: --hands needs a value.' };
    }
    if (hands !== undefined) {
      return { kind: 'error', message: 'Error: --hands given more than once.' };
    }
    hands = value;
    i++;
  }
  if (help) {
    return hands === undefined && !lineUps
      ? { kind: 'help' }
      : { kind: 'error', message: 'Error: --help cannot be combined with other options.' };
  }
  if (hands === undefined) return { kind: 'run', hands: MILLION_HANDS, lineUps };
  const value = /^[0-9]+$/.test(hands) ? Number(hands) : NaN;
  if (value >= (lineUps ? LINEUP_SHARDS : SHARD_SIZES.length) && value <= MAX_HANDS) {
    return { kind: 'run', hands: value, lineUps };
  }
  return {
    kind: 'error',
    message: lineUps
      ? 'Error: --hands must be a whole number from 27 to 1000000000 with --lineups.'
      : 'Error: --hands must be a whole number from 9 to 1000000000.',
  };
}

/** Returns the exit code: 0 every shard passed, 1 a violation or failed shard, 2 usage error. */
export async function millionMain(
  argv: readonly string[],
  io: CliIo,
  runShard: ShardRunner,
  concurrency: number,
): Promise<number> {
  const parsed = parseMillionArgs(argv);
  if (parsed.kind === 'error') {
    io.err(`${parsed.message}\n${MILLION_USAGE}`);
    return 2;
  }
  if (parsed.kind === 'help') {
    io.out(MILLION_USAGE);
    return 0;
  }
  const plan = parsed.lineUps ? planLineUpShards(parsed.hands) : planShards(parsed.hands);
  const results = await runShards(plan, runShard, concurrency);
  io.out(formatMillionReport(parsed.hands, results));
  return results.every((result) => result.passed) ? 0 : 1;
}
