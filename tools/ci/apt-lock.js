// CI apt-lock wrapper (TASK-1.29): waits until no process holds an apt/dpkg lock, then runs a command.
// Holders are read from /proc/locks (world-readable), so no sudo or external tool is needed.
// Usage: node tools/ci/apt-lock.js --wait-seconds <s> [--poll-seconds <s>] [--lock <path>]...
//          [--proc-locks <path>] -- <command> [args...]
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import process from 'node:process';
import { setTimeout } from 'node:timers';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const DEFAULT_LOCKS = [
  '/var/lib/dpkg/lock-frontend',
  '/var/lib/dpkg/lock',
  '/var/lib/apt/lists/lock',
  '/var/cache/apt/archives/lock',
];

class UsageError extends Error {}

/** @param {string} line */
const log = (line) => process.stdout.write(`${line}\n`);

/**
 * @typedef {{ pid: number | null, major: number, minor: number, inode: bigint }} LockEntry
 * @typedef {{ path: string, pid: number | null }} HeldLock
 * @typedef {HeldLock & { name: string | null }} NamedHeldLock
 */

const LOCK_LINE = /^\d+:\s+\S+\s+\S+\s+\S+\s+(-?\d+)\s+([0-9a-f]+):([0-9a-f]+):(\d+)\s/i;

/**
 * Parses /proc/locks into the lock holders. Blocked waiters (`->`) and malformed lines are skipped.
 * @param {string} text
 * @returns {LockEntry[]}
 */
export function parseProcLocks(text) {
  /** @type {LockEntry[]} */
  const entries = [];
  for (const line of text.split('\n')) {
    if (line.includes('->')) continue;
    const match = LOCK_LINE.exec(line);
    if (!match) continue;
    const [, pid = '', major = '', minor = '', inode = ''] = match;
    entries.push({
      pid: pid === '-1' ? null : Number(pid),
      major: parseInt(major, 16),
      minor: parseInt(minor, 16),
      inode: BigInt(inode),
    });
  }
  return entries;
}

/**
 * Splits a device number with the Linux/glibc encoding.
 * Linux's kernel dev_t is 12-bit major / 20-bit minor, so /proc/locks and stat never report a
 * major >= 4096 on Linux; the masks follow glibc's gnu_dev_major/gnu_dev_minor so the decode is
 * still correct in that case.
 * @param {bigint} dev
 */
export function devParts(dev) {
  const major = ((dev >> 8n) & 0xfffn) | ((dev >> 32n) & 0xfffff000n);
  const minor = (dev & 0xffn) | ((dev >> 12n) & 0xffffff00n);
  return { major: Number(major), minor: Number(minor) };
}

/**
 * Returns the first lock path (in order) that a /proc/locks entry holds. A missing file is free.
 * @param {string[]} lockPaths
 * @param {string} procLocksText
 * @param {(path: string) => { dev: bigint, ino: bigint } | null} statPath
 * @returns {HeldLock | null}
 */
export function findHeldLock(lockPaths, procLocksText, statPath) {
  const entries = parseProcLocks(procLocksText);
  for (const path of lockPaths) {
    const stat = statPath(path);
    if (stat === null) continue;
    const { major, minor } = devParts(stat.dev);
    const holder = entries.find(
      (entry) => entry.inode === stat.ino && entry.major === major && entry.minor === minor,
    );
    if (holder) return { path, pid: holder.pid };
  }
  return null;
}

/** @param {string} path */
function statLockFile(path) {
  try {
    const { dev, ino } = statSync(path, { bigint: true });
    return { dev, ino };
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return null;
    throw error;
  }
}

/** @param {number | null} pid */
function processName(pid) {
  if (pid === null) return null;
  try {
    return readFileSync(`/proc/${pid}/comm`, 'utf8').trim();
  } catch {
    return null;
  }
}

/**
 * Names the lock holder for the job log. Control characters in the name (which any local process
 * can set) become `?`, so the name cannot start a new workflow-command line.
 * @param {NamedHeldLock} held
 */
export function holderText(held) {
  if (held.pid === null) return 'an unknown process';
  if (!held.name) return `process ${held.pid}`;
  // eslint-disable-next-line no-control-regex
  return `process ${held.pid} (${held.name.replace(/[\x00-\x1f\x7f]/g, '?')})`;
}

/**
 * Waits until no lock in `lockPaths` is held. Resolves to null once free, else the last held lock.
 * @param {{ lockPaths: string[], procLocksPath: string, waitSeconds: number, pollSeconds: number,
 *   now: () => number, sleep: (ms: number) => Promise<void>, log: (line: string) => void }} options
 * @returns {Promise<NamedHeldLock | null>}
 */
export async function waitForAptLocks(options) {
  const { lockPaths, procLocksPath, waitSeconds, pollSeconds, now, sleep } = options;
  if (!existsSync(procLocksPath)) {
    options.log(`apt-lock: ${procLocksPath} not found; running without waiting`);
    return null;
  }
  /** @returns {NamedHeldLock | null} */
  const check = () => {
    const held = findHeldLock(lockPaths, readFileSync(procLocksPath, 'utf8'), statLockFile);
    return held && { ...held, name: processName(held.pid) };
  };
  const start = now();
  let held = check();
  if (held === null) return null;
  options.log(
    `apt-lock: waiting up to ${waitSeconds} s for ${held.path} (held by ${holderText(held)})`,
  );
  const limitMs = waitSeconds * 1000;
  while (now() - start < limitMs) {
    await sleep(Math.min(pollSeconds * 1000, limitMs - (now() - start)));
    held = check();
    if (held === null) {
      options.log(`apt-lock: apt locks are free after ${((now() - start) / 1000).toFixed(1)} s`);
      return null;
    }
  }
  return held;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<number>}
 */
function runCommand(command, args) {
  const commandLine = [command, ...args].join(' ');
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', (error) => {
      log(`::error::apt-lock: could not start ${commandLine}: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code, signal) => {
      if (code !== null) return resolve(code);
      log(`apt-lock: ${commandLine} was killed by ${signal}`);
      resolve(1);
    });
  });
}

/** @param {string[]} argv */
function parseOptions(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        'wait-seconds': { type: 'string' },
        'poll-seconds': { type: 'string' },
        lock: { type: 'string', multiple: true },
        'proc-locks': { type: 'string' },
      },
      allowPositionals: true,
      strict: true,
      tokens: true,
    });
  } catch (error) {
    throw new UsageError(/** @type {Error} */ (error).message);
  }
  const terminator = parsed.tokens.find((token) => token.kind === 'option-terminator');
  if (!terminator) throw new UsageError('missing -- before the command');
  const stray = parsed.tokens.find((t) => t.kind === 'positional' && t.index < terminator.index);
  if (stray?.kind === 'positional') throw new UsageError(`unexpected argument "${stray.value}"`);
  const [command, ...args] = parsed.positionals;
  if (!command) throw new UsageError('no command after --');

  /**
   * @param {'wait-seconds' | 'poll-seconds'} name
   * @param {number} [fallback]
   */
  const seconds = (name, fallback) => {
    const text = parsed.values[name];
    if (text === undefined && fallback !== undefined) return fallback;
    if (text === undefined) throw new UsageError(`--${name} is required`);
    const value = Number(text);
    if (text.trim() === '' || !Number.isFinite(value) || value <= 0) {
      throw new UsageError(`--${name} must be a number > 0, got "${text}"`);
    }
    return value;
  };
  return {
    waitSeconds: seconds('wait-seconds'),
    pollSeconds: seconds('poll-seconds', 2),
    lockPaths: parsed.values.lock ?? DEFAULT_LOCKS,
    procLocksPath: parsed.values['proc-locks'] ?? '/proc/locks',
    command,
    args,
  };
}

/** @param {string[]} argv */
async function main(argv) {
  const options = parseOptions(argv);
  const held = await waitForAptLocks({
    ...options,
    now: Date.now,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log,
  });
  if (held !== null) {
    const commandLine = [options.command, ...options.args].join(' ');
    log(
      `::error::apt lock ${held.path} is still held by ${holderText(held)} after ${options.waitSeconds} s; not running ${commandLine}`,
    );
    return 1;
  }
  return runCommand(options.command, options.args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(`apt-lock: usage: ${error.message}\n`);
    process.exitCode = 2;
  }
}
