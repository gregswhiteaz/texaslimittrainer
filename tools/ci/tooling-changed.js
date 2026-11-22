// CI tooling change detector (TASK-1.50). Decides whether the process-spawning tooling tests
// (`npm run test:tooling`) must run, from the files changed by a push or pull request. When the
// change base cannot be determined it decides `tooling=true` and prints a `::warning::` line.
// Usage: node tools/ci/tooling-changed.js --event <name> [--base <sha>] [--head <sha>]
//        [--default-branch <name>]
// Prints the reason, up to 20 matched paths (indented two spaces, so a file name can never start a
// workflow-command line) and `tooling=true|false` as the last line; appends
// `tooling=<v>` to $GITHUB_OUTPUT when set. Exit codes: 0 decided, 2 usage error.
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

export const TOOLING_DIRS = [
  'tools/',
  '.github/',
  'tests/ci/',
  'tests/git/',
  'tests/toolchain/',
  'tests/support/',
  'e2e/cards.visual.spec.ts-snapshots/',
];

export const TOOLING_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'eslint.config.js',
  'vite.config.ts',
  'playwright.config.ts',
  '.prettierrc.json',
  '.prettierignore',
  '.nvmrc',
  'README.md',
  'index.html',
  'src/engine/bot-random.ts',
];

const PERF_TEST = /\.perf\.test\.[cm]?[jt]sx?$/;
const SHA = /^[0-9a-f]{40}$/;
const ZERO_SHA = '0'.repeat(40);
const BRANCH = /^[\w./-]+$/;
const MAX_LISTED = 20;

class UsageError extends Error {}

/**
 * Replaces control characters with `?`, so a file name cannot start a workflow-command line.
 * @param {string} text
 */
// eslint-disable-next-line no-control-regex
const safe = (text) => text.replace(/[\x00-\x1f\x7f]/g, '?');

/** @param {string} path */
export function isToolingPath(path) {
  return (
    TOOLING_DIRS.some((dir) => path.startsWith(dir)) ||
    TOOLING_FILES.includes(path) ||
    PERF_TEST.test(path)
  );
}

/** @typedef {(args: string[]) => { status: number, stdout: string }} Git */
/** @typedef {{ tooling: boolean, reason: string, matched: string[] }} Decision */

/** @type {Git} */
function runGit(args) {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: result.status ?? -1, stdout: result.stdout ?? '' };
}

/**
 * @param {string} reason
 * @returns {Decision}
 */
const failSafe = (reason) => ({ tooling: true, reason: `::warning::${reason}`, matched: [] });

/**
 * @param {{ event: string, base?: string, head?: string, defaultBranch?: string }} options
 * @param {Git} [git]
 * @returns {Decision}
 */
export function decide({ event, base = '', head = '', defaultBranch = '' }, git = runGit) {
  if (event === 'schedule' || event === 'workflow_dispatch') {
    return { tooling: true, reason: `always run on ${event}`, matched: [] };
  }
  if (event !== 'push' && event !== 'pull_request') {
    return failSafe(`unknown event ${safe(event)}; running tooling tests`);
  }
  if (!SHA.test(head)) return failSafe(`invalid head ${safe(head)}; running tooling tests`);

  let from = base;
  if (event === 'push' && (base === '' || base === ZERO_SHA)) {
    if (!BRANCH.test(defaultBranch)) {
      return failSafe(`invalid default branch ${safe(defaultBranch)}; running tooling tests`);
    }
    const mergeBase = git(['merge-base', `origin/${defaultBranch}`, head]);
    from = mergeBase.stdout.trim();
    if (mergeBase.status !== 0 || !SHA.test(from)) {
      return failSafe(`no merge base with origin/${defaultBranch}; running tooling tests`);
    }
  } else if (!SHA.test(base) || git(['cat-file', '-e', `${base}^{commit}`]).status !== 0) {
    return failSafe(`base ${safe(base)} not available; running tooling tests`);
  }

  const range = event === 'pull_request' ? [`${from}...${head}`] : [from, head];
  const diff = git(['diff', '--name-only', '--no-renames', '-z', ...range]);
  if (diff.status !== 0) return failSafe(`git diff failed; running tooling tests`);

  const changed = diff.stdout.split('\0').filter(Boolean);
  const matched = changed.filter(isToolingPath);
  return matched.length > 0
    ? { tooling: true, reason: `${matched.length} tooling file(s) changed`, matched }
    : {
        tooling: false,
        reason: `no tooling files among ${changed.length} changed file(s)`,
        matched,
      };
}

/** @param {string[]} argv */
function parseOptions(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        event: { type: 'string' },
        base: { type: 'string' },
        head: { type: 'string' },
        'default-branch': { type: 'string' },
      },
      strict: true,
    });
  } catch (error) {
    throw new UsageError(/** @type {Error} */ (error).message);
  }
  const { event, base, head, 'default-branch': defaultBranch } = parsed.values;
  if (!event) throw new UsageError('--event is required');
  return { event, base, head, defaultBranch };
}

/** @param {string[]} argv */
function main(argv) {
  const decision = decide(parseOptions(argv));
  const lines = [
    decision.reason,
    ...decision.matched.slice(0, MAX_LISTED).map((path) => `  ${safe(path)}`),
  ];
  if (decision.matched.length > MAX_LISTED) {
    lines.push(`... and ${decision.matched.length - MAX_LISTED} more`);
  }
  lines.push(`tooling=${decision.tooling}`);
  process.stdout.write(`${lines.join('\n')}\n`);
  const output = process.env.GITHUB_OUTPUT;
  if (output) appendFileSync(output, `tooling=${decision.tooling}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(`tooling-changed: ${safe(error.message)}\n`);
    process.exitCode = 2;
  }
}
