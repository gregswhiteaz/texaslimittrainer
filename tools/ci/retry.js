// CI retry helper (TASK-1.19): runs a command with a per-attempt timeout and retries it.
// A timed-out attempt's whole process group is killed (the command runs apt through sudo). If a
// group kill is refused (EPERM, root members left behind by sudo), it is sent again with
// `sudo -n kill` (only while the group still exists), and the next attempt starts only once the
// group is gone. Cancelling the helper (SIGINT/SIGTERM) stops the running attempt the same way. An
// attempt whose group cannot be stopped ends the helper with an ::error:: line.
// Usage: node tools/ci/retry.js --label <text> --attempts <n> --timeout-seconds <s>
//          [--delay-seconds <s>] [--kill-after-seconds <s>] -- <command> [args...]
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {{ label: string, attempts: number, timeoutSeconds: number, delaySeconds: number,
 *   killAfterSeconds: number, command: string, args: string[] }} RetryOptions
 */

/** @typedef {(pid: number, signal: NodeJS.Signals) => boolean} SudoKill */

/** @typedef {{ pid: number | undefined, reap: () => Promise<boolean> }} Attempt */

class UsageError extends Error {}

const REAP_SECONDS = 2;
const REAP_POLL_MS = 250;

/** @param {string} line */
const log = (line) => process.stdout.write(`${line}\n`);

/**
 * Signals the process group led by `pid`. A group that is already gone (ESRCH) or whose remaining
 * members we may not signal (EPERM, e.g. root-owned under sudo) must not stop the retry loop.
 * @param {number | undefined} pid
 * @param {NodeJS.Signals} signal
 * @returns {'sent' | 'gone' | 'denied'}
 */
export function killGroup(pid, signal) {
  if (pid === undefined) return 'gone';
  try {
    process.kill(-pid, signal);
    return 'sent';
  } catch (error) {
    const code = /** @type {NodeJS.ErrnoException} */ (error).code;
    if (code === 'ESRCH') return 'gone';
    if (code !== 'EPERM') throw error;
    log(`retry: could not send ${signal} to process group ${pid} (EPERM)`);
    return 'denied';
  }
}

/**
 * Whether the process group led by `pid` still has members (EPERM means members we may not signal).
 * @param {number} pid
 */
export function groupExists(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    const code = /** @type {NodeJS.ErrnoException} */ (error).code;
    if (code === 'EPERM') return true;
    if (code === 'ESRCH') return false;
    throw error;
  }
}

/**
 * Signals the process group with `sudo -n kill` (never prompts). Returns whether sudo succeeded.
 * @type {SudoKill}
 */
export function sudoKillGroup(pid, signal) {
  const name = signal.replace(/^SIG/, '');
  const result = spawnSync('sudo', ['-n', 'kill', '-s', name, '--', `-${pid}`], {
    stdio: 'ignore',
    timeout: 10_000,
  });
  const sent = result.status === 0;
  log(
    sent
      ? `retry: sent ${signal} to process group ${pid} with sudo`
      : `retry: sudo could not send ${signal} to process group ${pid}`,
  );
  return sent;
}

/**
 * Signals the group; a refused signal is sent again with sudo if the group still exists.
 * @param {number | undefined} pid
 * @param {NodeJS.Signals} signal
 * @param {SudoKill} sudoKill
 */
function stopGroup(pid, signal, sudoKill) {
  if (killGroup(pid, signal) === 'denied' && pid !== undefined && groupExists(pid)) {
    sudoKill(pid, signal);
  }
}

/**
 * Keeps SIGKILLing the group until it is gone, for at most REAP_SECONDS. Resolves to whether it is gone.
 * A just-killed group can refuse one kill while it dies, so sudo runs only after two refusals in a row.
 * @param {number | undefined} pid
 * @param {SudoKill} sudoKill
 */
async function reap(pid, sudoKill) {
  if (pid === undefined) return true;
  const deadline = Date.now() + REAP_SECONDS * 1000;
  let deniedLastPoll = false;
  while (Date.now() < deadline) {
    if (!groupExists(pid)) return true;
    const outcome = killGroup(pid, 'SIGKILL');
    if (outcome === 'denied' && deniedLastPoll && groupExists(pid)) sudoKill(pid, 'SIGKILL');
    deniedLastPoll = outcome === 'denied';
    await sleep(REAP_POLL_MS);
  }
  return !groupExists(pid);
}

/**
 * Runs one attempt in its own process group. `failure` is null on success, else the reason;
 * `stuck` means the failed attempt's process group could not be stopped.
 * @param {RetryOptions} options
 * @param {(attempt: Attempt) => void} onSpawn
 * @param {SudoKill} sudoKill
 * @returns {Promise<{ failure: string | null, stuck: boolean }>}
 */
function runAttempt(options, onSpawn, sudoKill) {
  return new Promise((resolve) => {
    const child = spawn(options.command, options.args, { stdio: 'inherit', detached: true });
    const pid = child.pid;
    /** @type {Promise<boolean> | undefined} */
    let reaping;
    // The kill timer, the child's exit and a cancellation all share one reap loop.
    const reapOnce = () => (reaping ??= reap(pid, sudoKill));
    onSpawn({ pid, reap: reapOnce });
    const timeoutFailure = `timed out after ${options.timeoutSeconds} s`;
    let timedOut = false;
    let exited = false;
    let settled = false;
    /** @param {{ failure: string | null, stuck: boolean }} result */
    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    /** @type {NodeJS.Timeout | undefined} */
    let killTimer;
    const timer = setTimeout(() => {
      timedOut = true;
      stopGroup(pid, 'SIGTERM', sudoKill);
      killTimer = setTimeout(async () => {
        stopGroup(pid, 'SIGKILL', sudoKill);
        if ((await reapOnce()) || exited) return;
        // The child itself cannot be killed: give up on it so the helper can still exit.
        child.unref();
        settle({ failure: timeoutFailure, stuck: true });
      }, options.killAfterSeconds * 1000);
    }, options.timeoutSeconds * 1000);
    /** @param {string | null} failure */
    const finish = async (failure) => {
      exited = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      // Also reap descendants (e.g. apt still holding its lock) before the next attempt.
      const reaped = await reapOnce();
      const result = timedOut ? timeoutFailure : failure;
      settle({ failure: result, stuck: !reaped && result !== null });
    };
    child.on('error', (error) => void finish(`could not start: ${error.message}`));
    child.on('exit', (code, signal) => {
      if (code === 0) void finish(null);
      else void finish(code === null ? `was killed by ${signal}` : `failed with exit code ${code}`);
    });
  });
}

/**
 * @param {RetryOptions} options
 * @param {SudoKill} [sudoKill] sends a signal to a process group with sudo (replaced in tests)
 * @returns {Promise<number>} the exit code for the helper
 */
export async function runWithRetry(options, sudoKill = sudoKillGroup) {
  const { label, attempts } = options;
  const commandLine = [options.command, ...options.args].join(' ');
  /** @type {Attempt | undefined} */
  let current;
  let stopping = false;
  /** @param {NodeJS.Signals} signal */
  const onSignal = async (signal) => {
    if (stopping) return;
    stopping = true;
    if (current) {
      stopGroup(current.pid, 'SIGKILL', sudoKill);
      await current.reap();
    }
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
  try {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const prefix = `${label}: attempt ${attempt} of ${attempts}`;
      log(`retry: ${prefix}: ${commandLine}`);
      const started = Date.now();
      const { failure, stuck } = await runAttempt(
        options,
        (spawned) => (current = spawned),
        sudoKill,
      );
      const pid = current?.pid;
      current = undefined;
      if (failure === null) {
        log(`retry: ${prefix} succeeded in ${((Date.now() - started) / 1000).toFixed(1)} s`);
        return 0;
      }
      if (stuck) {
        log(`::warning::${prefix} ${failure}`);
        log(`::error::${prefix} could not be stopped; process group ${pid} is still running`);
        return 1;
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
