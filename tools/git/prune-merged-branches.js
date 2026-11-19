// Branch cleanup (TASK-1.24): lists the doit/* branches already merged into main, locally and on
// origin, and deletes them with --apply. Without --apply nothing is deleted.
// Usage: node tools/git/prune-merged-branches.js [--apply]
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const NAME = 'prune-merged-branches';
const USAGE = 'node tools/git/prune-merged-branches.js [--apply]';
const REMOTE = 'origin';
const BASE = 'main';
const PREFIX = 'doit/';

export class UsageError extends Error {}

/**
 * @param {string[]} argv
 * @returns {{ apply: boolean }}
 */
export function parseOptions(argv) {
  for (const arg of argv) {
    if (arg !== '--apply') throw new UsageError(`unknown argument ${arg}. Usage: ${USAGE}`);
  }
  return { apply: argv.length > 0 };
}

/** @param {string[]} names */
const listLines = (names) => (names.length === 0 ? ['  (none)'] : names.map((n) => `  ${n}`));

/**
 * @param {{ apply: boolean, local: string[], remote: string[], skipped: string[] }} plan
 * @returns {string}
 */
export function formatPlan(plan) {
  const lines = [
    plan.apply
      ? 'Deleting these branches.'
      : 'Dry run: nothing deleted. Re-run with --apply to delete these branches.',
    `Local ${PREFIX}* branches merged into ${BASE} (${plan.local.length}):`,
    ...listLines(plan.local),
    `Remote ${PREFIX}* branches on ${REMOTE} merged into ${REMOTE}/${BASE} (${plan.remote.length}):`,
    ...listLines(plan.remote),
  ];
  if (plan.skipped.length > 0) lines.push(`Skipped (checked out): ${plan.skipped.join(', ')}`);
  return `${lines.join('\n')}\n`;
}

/** @param {string[]} args */
const git = (args) => spawnSync('git', args, { encoding: 'utf8' });

/** @param {string} message */
const fail = (message) => process.stderr.write(`${NAME}: ${message}\n`);

/** @param {string} output */
const lines = (output) => output.split('\n').filter((line) => line !== '');

/**
 * @param {boolean} apply
 * @returns {number} the exit code
 */
function run(apply) {
  if (git(['rev-parse', '--git-dir']).status !== 0) {
    fail('not inside a git repository');
    return 2;
  }
  const fetch = git(['fetch', '--prune', REMOTE]);
  if (fetch.status !== 0) {
    fail(`could not fetch ${REMOTE}`);
    process.stderr.write(fetch.stderr);
    return 1;
  }
  const localBase = `refs/heads/${BASE}`;
  const remoteBase = `refs/remotes/${REMOTE}/${BASE}`;
  for (const ref of [localBase, remoteBase]) {
    if (git(['rev-parse', '--verify', '--quiet', ref]).status !== 0) {
      fail(`missing ref ${ref.replace(/^refs\/(heads|remotes)\//, '')}`);
      return 1;
    }
  }
  const current = git(['symbolic-ref', '--quiet', '--short', 'HEAD']).stdout.trim();
  const mergedLocal = lines(
    git([
      'for-each-ref',
      `--merged=${localBase}`,
      '--format=%(refname:short)',
      `refs/heads/${PREFIX}`,
    ]).stdout,
  );
  const remote = lines(
    git([
      'for-each-ref',
      `--merged=${remoteBase}`,
      '--format=%(refname:lstrip=3)',
      `refs/remotes/${REMOTE}/${PREFIX}`,
    ]).stdout,
  );
  const local = mergedLocal.filter((name) => name !== current);
  const skipped = mergedLocal.filter((name) => name === current);
  process.stdout.write(formatPlan({ apply, local, remote, skipped }));
  if (!apply) return 0;

  let exitCode = 0;
  /** @param {string[]} args */
  const runOrReport = (args) => {
    const result = git(args);
    if (result.status === 0) return;
    fail(`git ${args.join(' ')} failed`);
    process.stderr.write(result.stderr);
    exitCode = 1;
  };
  for (const name of local) runOrReport(['branch', '-D', name]);
  if (remote.length > 0) runOrReport(['push', REMOTE, '--delete', ...remote]);
  if (exitCode === 0) {
    process.stdout.write(`Deleted ${local.length} local and ${remote.length} remote branches.\n`);
  }
  return exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = run(parseOptions(process.argv.slice(2)).apply);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    fail(error.message);
    process.exitCode = 2;
  }
}
