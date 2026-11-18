// CI retry helper (TASK-1.19): runs a command with a per-attempt timeout and retries it.
// A timed-out attempt's whole process group is killed (the command runs apt through sudo).
// Usage: node tools/ci/retry.js --label <text> --attempts <n> --timeout-seconds <s>
//          [--delay-seconds <s>] [--kill-after-seconds <s>] -- <command> [args...]
import { spawn } from 'node:child_process';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {{ label: string, attempts: number, timeoutSeconds: number, delaySeconds: number,
 *   killAfterSeconds: number, command: string, args: string[] }} RetryOptions
 */

class UsageError extends Error {}

/** @param {string} line */
const log = (line) => process.stdout.write(`${line}\n`);

/**
 * Signals the process group led by `pid`, ignoring a group that is already gone.
 * @param {number | undefined} pid
 * @param {NodeJS.Signals} signal
 */
function killGroup(pid, signal) {
  if (pid === undefined) return;
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ESRCH') throw error;
  }
}

/**
 * Runs one attempt in its own process group. Resolves to null on success, else the failure reason.
 * @param {RetryOptions} options
 * @param {(pid: number | undefined) => void} onSpawn
 * @returns {Promise<string | null>}
 */
function runAttempt(options, onSpawn) {
  return new Promise((resolve) => {
    const child = spawn(options.command, options.args, { stdio: 'inherit', detached: true });
    onSpawn(child.pid);
    let timedOut = false;
    /** @type {NodeJS.Timeout | undefined} */
    let killTimer;
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup(child.pid, 'SIGTERM');
      killTimer = setTimeout(
        () => killGroup(child.pid, 'SIGKILL'),
        options.killAfterSeconds * 1000,
      );
    }, options.timeoutSeconds * 1000);
    /** @param {string | null} failure */
    const finish = (failure) => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      // Also reap descendants (e.g. apt still holding its lock) before the next attempt.
      killGroup(child.pid, 'SIGKILL');
      resolve(timedOut ? `timed out after ${options.timeoutSeconds} s` : failure);
    };
    child.on('error', (error) => finish(`could not start: ${error.message}`));
    child.on('exit', (code, signal) => {
      if (code === 0) finish(null);
      else finish(code === null ? `was killed by ${signal}` : `failed with exit code ${code}`);
    });
  });
}

/**
 * @param {RetryOptions} options
 * @returns {Promise<number>} the exit code for the helper
 */
export async function runWithRetry(options) {
  const { label, attempts } = options;
  const commandLine = [options.command, ...options.args].join(' ');
  /** @type {number | undefined} */
  let currentPid;
  /** @param {NodeJS.Signals} signal */
  const onSignal = (signal) => {
    killGroup(currentPid, 'SIGKILL');
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  try {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const prefix = `${label}: attempt ${attempt} of ${attempts}`;
      log(`retry: ${prefix}: ${commandLine}`);
      const started = Date.now();
      const failure = await runAttempt(options, (pid) => (currentPid = pid));
      currentPid = undefined;
      if (failure === null) {
        log(`retry: ${prefix} succeeded in ${((Date.now() - started) / 1000).toFixed(1)} s`);
        return 0;
      }
      if (attempt === attempts) {
        log(`::warning::${prefix} ${failure}`);
      } else {
        log(`::warning::${prefix} ${failure}; retrying in ${options.delaySeconds} s`);
        await new Promise((resolve) => setTimeout(resolve, options.delaySeconds * 1000));
      }
    }
    log(`::error::${label} failed after ${attempts} attempts`);
    return 1;
  } finally {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}

/** @param {string[]} argv */
function parseCommandLine(argv) {
  const option = /** @type {const} */ ({ type: 'string' });
  const options = {
    label: option,
    attempts: option,
    'timeout-seconds': option,
    'delay-seconds': option,
    'kill-after-seconds': option,
  };
  try {
    return parseArgs({ args: argv, options, allowPositionals: true, strict: true, tokens: true });
  } catch (error) {
    throw new UsageError(/** @type {Error} */ (error).message);
  }
}

/**
 * @param {string[]} argv
 * @returns {RetryOptions}
 */
function parseOptions(argv) {
  const parsed = parseCommandLine(argv);
  const terminator = parsed.tokens.find((token) => token.kind === 'option-terminator');
  if (!terminator) throw new UsageError('missing -- before the command');
  const stray = parsed.tokens.find((t) => t.kind === 'positional' && t.index < terminator.index);
  if (stray?.kind === 'positional') throw new UsageError(`unexpected argument "${stray.value}"`);
  const [command, ...args] = parsed.positionals;
  if (!command) throw new UsageError('no command after --');
  const { label } = parsed.values;
  if (!label) throw new UsageError('--label is required');

  /**
   * @param {'attempts' | 'timeout-seconds' | 'delay-seconds' | 'kill-after-seconds'} name
   * @param {(value: number) => boolean} isValid
   * @param {string} requirement
   * @param {number} [fallback]
   */
  const number = (name, isValid, requirement, fallback) => {
    const text = parsed.values[name];
    if (text === undefined && fallback !== undefined) return fallback;
    if (text === undefined) throw new UsageError(`--${name} is required`);
    const value = Number(text);
    if (text.trim() === '' || !Number.isFinite(value) || !isValid(value)) {
      throw new UsageError(`--${name} must be ${requirement}, got "${text}"`);
    }
    return value;
  };
  /** @param {number} value */
  const positive = (value) => value > 0;
  return {
    label,
    attempts: number('attempts', (v) => Number.isInteger(v) && v >= 1, 'an integer >= 1'),
    timeoutSeconds: number('timeout-seconds', positive, 'a number > 0'),
    delaySeconds: number('delay-seconds', (v) => v >= 0, 'a number >= 0', 10),
    killAfterSeconds: number('kill-after-seconds', positive, 'a number > 0', 10),
    command,
    args,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await runWithRetry(parseOptions(process.argv.slice(2)));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(`retry: usage: ${error.message}\n`);
    process.exitCode = 2;
  }
}
