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

/**
 * Deletes the listed remote branches only if each still points at the SHA it was listed with.
 * @param {{ name: string, sha: string }[]} branches
 * @returns {string[]}
 */
export function remoteDeleteArgs(branches) {
  return [
    'push',
    '--porcelain',
    REMOTE,
    ...branches.map((b) => `--force-with-lease=refs/heads/${b.name}:${b.sha}`),
    '--delete',
    ...branches.map((b) => b.name),
  ];
}

/**
 * Parses porcelain push lines like `!<TAB>(delete):refs/heads/doit/a<TAB>[rejected] (stale info)`.
 * @param {string} porcelain
 * @returns {{ name: string, summary: string }[]}
 */
export function refusedBranches(porcelain) {
  return porcelain
    .split('\n')
    .filter((line) => line.startsWith('!\t'))
    .map((line) => {
      const [, refs = '', summary = ''] = line.split('\t');
      const name = refs.slice(refs.lastIndexOf(':') + 1).replace(/^refs\/heads\//, '');
      return { name, summary: summary.trim() };
    });
}

/** @param {string[]} args */
const git = (args) => spawnSync('git', args, { encoding: 'utf8' });

/** @param {string} message */
const reportError = (message) => process.stderr.write(`${NAME}: ${message}\n`);

/** @param {string} output */
const outputLines = (output) => output.split('\n').filter((line) => line !== '');

/**
 * @param {boolean} apply
 * @returns {number} the exit code
 */
function run(apply) {
  if (git(['rev-parse', '--git-dir']).status !== 0) {
    reportError('not inside a git repository');
    return 2;
  }
  const fetch = git(['fetch', '--prune', REMOTE]);
  if (fetch.status !== 0) {
    reportError(`could not fetch ${REMOTE}`);
    process.stderr.write(fetch.stderr);
    return 1;
  }
  const localBase = `refs/heads/${BASE}`;
  const remoteBase = `refs/remotes/${REMOTE}/${BASE}`;
  for (const ref of [localBase, remoteBase]) {
    if (git(['rev-parse', '--verify', '--quiet', ref]).status !== 0) {
      reportError(`missing ref ${ref.replace(/^refs\/(heads|remotes)\//, '')}`);
      return 1;
    }
  }
  const current = git(['symbolic-ref', '--quiet', '--short', 'HEAD']).stdout.trim();
  const mergedLocal = outputLines(
    git([
      'for-each-ref',
      `--merged=${localBase}`,
      '--format=%(refname:short)',
      `refs/heads/${PREFIX}`,
    ]).stdout,
  );
  const remote = outputLines(
    git([
      'for-each-ref',
      `--merged=${remoteBase}`,
      '--format=%(objectname) %(refname:lstrip=3)',
      `refs/remotes/${REMOTE}/${PREFIX}`,
    ]).stdout,
  ).map((line) => {
    const [sha = '', name = ''] = line.split(' ');
    return { name, sha };
  });
  const local = mergedLocal.filter((name) => name !== current);
  const skipped = mergedLocal.filter((name) => name === current);
  process.stdout.write(formatPlan({ apply, local, remote: remote.map((b) => b.name), skipped }));
  if (!apply) return 0;

  let exitCode = 0;
  /** @param {string[]} args */
  const runOrReport = (args) => {
    const result = git(args);
    if (result.status === 0) return;
    reportError(`git ${args.join(' ')} failed`);
    process.stderr.write(result.stderr);
    exitCode = 1;
  };
  for (const name of local) runOrReport(['branch', '-D', name]);
  if (remote.length > 0) {
    const args = remoteDeleteArgs(remote);
    const result = git(args);
    if (result.status !== 0) {
      const refused = refusedBranches(result.stdout);
      for (const { name, summary } of refused) {
        reportError(`refused to delete ${name} on ${REMOTE}: ${summary}`);
      }
      if (refused.length === 0) {
        reportError(`git ${args.join(' ')} failed`);
        process.stderr.write(result.stderr);
      }
      exitCode = 1;
    }
  }
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
    reportError(error.message);
    process.exitCode = 2;
  }
}
