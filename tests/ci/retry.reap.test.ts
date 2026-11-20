import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runWithRetry } from '../../tools/ci/retry.js';
import { REPO_ROOT } from '../support/sandbox';

const RETRY = join(REPO_ROOT, 'tools/ci/retry.js');
const LABEL = 'Install Playwright system dependencies';
const realKill = process.kill.bind(process);

function errno(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

afterEach(() => {
  vi.restoreAllMocks();
});

/** Captures the helper's log lines. */
function captureOutput(): () => string {
  let output = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    output += String(chunk);
    return true;
  });
  return () => output;
}

/** Spies on process.kill: group calls (negative pid) go to `onGroup`, the rest to the real kill. */
function spyGroupKill(onGroup: (signal: string | number | undefined, pid: number) => true) {
  return vi
    .spyOn(process, 'kill')
    .mockImplementation((target, signal) =>
      target < 0 ? onGroup(signal, -target) : realKill(target, signal),
    );
}

function killChildGroup(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    realKill(-pid, 'SIGKILL');
  } catch {
    // Already gone.
  }
}

function options(script: string, timeoutSeconds = 0.3) {
  return {
    label: LABEL,
    attempts: 1,
    delaySeconds: 0,
    timeoutSeconds,
    killAfterSeconds: 0.3,
    command: process.execPath,
    args: ['-e', script],
  };
}

const lastLine = (output: string) => output.trimEnd().split('\n').at(-1);
const count = (output: string, line: string) => output.split('\n').filter((l) => l === line).length;

describe('sudo escalation', () => {
  it('does not call sudo when a just-killed group refuses one kill and is gone at the next poll', async () => {
    const output = captureOutput();
    let pid: number | undefined;
    let forwardedKill = false;
    let fakedProbe = false;
    let refusedAt: number | undefined;
    spyGroupKill((signal, group) => {
      pid = group;
      if (!forwardedKill) {
        const sent = realKill(-group, signal);
        forwardedKill = signal === 'SIGKILL';
        return sent;
      }
      if (signal === 0 && !fakedProbe) {
        fakedProbe = true;
        return true;
      }
      if (signal === 'SIGKILL' && refusedAt === undefined) {
        refusedAt = Date.now();
        throw errno('EPERM');
      }
      if (signal === 0 && refusedAt !== undefined && Date.now() - refusedAt < 100) {
        throw errno('EPERM');
      }
      return realKill(-group, signal);
    });
    const sudoKill = vi.fn(() => true);
    const started = Date.now();
    try {
      const code = await runWithRetry(
        options("process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"),
        sudoKill,
      );
      expect(code).toBe(1);
      expect(Date.now() - started).toBeLessThan(3000);
      expect(sudoKill).not.toHaveBeenCalled();
      expect(count(output(), `retry: could not send SIGKILL to process group ${pid} (EPERM)`)).toBe(
        1,
      );
      expect(lastLine(output())).toBe(`::error::${LABEL} failed after 1 attempts`);
      expect(output()).not.toContain('could not be stopped');
    } finally {
      vi.restoreAllMocks();
      killChildGroup(pid);
    }
  });

  it('checks the group right before sudo and skips sudo when it is gone', async () => {
    const output = captureOutput();
    let pid: number | undefined;
    const kill = spyGroupKill((signal, group) => {
      pid = group;
      if (signal === 'SIGTERM') throw errno('EPERM');
      if (signal === 0) throw errno('ESRCH');
      return realKill(-group, signal);
    });
    const sudoKill = vi.fn(() => true);
    const started = Date.now();
    try {
      const code = await runWithRetry(options('setInterval(() => {}, 1000)'), sudoKill);
      expect(code).toBe(1);
      expect(Date.now() - started).toBeLessThan(3000);
      expect(pid).toBeDefined();
      const group = -(pid ?? 0);
      const calls = kill.mock.calls;
      const refused = calls.findIndex(
        ([target, signal]) => target === group && signal === 'SIGTERM',
      );
      expect(refused).toBeGreaterThanOrEqual(0);
      expect(calls[refused + 1]).toEqual([group, 0]);
      expect(sudoKill).not.toHaveBeenCalled();
      expect(lastLine(output())).toBe(`::error::${LABEL} failed after 1 attempts`);
    } finally {
      vi.restoreAllMocks();
      killChildGroup(pid);
    }
  });

  it("runs one shared reap when the kill timer and the child's exit both reap", async () => {
    const output = captureOutput();
    let pid: number | undefined;
    spyGroupKill((_signal, group) => {
      pid = group;
      throw errno('EPERM');
    });
    const sudoKill = vi.fn<(pid: number, signal: NodeJS.Signals) => boolean>(() => false);
    const started = Date.now();
    try {
      const code = await runWithRetry(options('setTimeout(() => process.exit(3), 1000)'), sudoKill);
      expect(code).toBe(1);
      expect(Date.now() - started).toBeLessThan(4000);
      expect(
        count(output(), `retry: could not send SIGKILL to process group ${pid} (EPERM)`),
      ).toBeLessThanOrEqual(10);
      const sudoKills = sudoKill.mock.calls.filter(([, signal]) => signal === 'SIGKILL');
      expect(sudoKills.length).toBeLessThanOrEqual(9);
      expect(
        count(
          output(),
          `::error::${LABEL}: attempt 1 of 1 could not be stopped; process group ${pid} is still running`,
        ),
      ).toBe(1);
    } finally {
      vi.restoreAllMocks();
      killChildGroup(pid);
    }
  });
});

describe('cancelling an attempt', () => {
  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ] as const)('escalates a refused group kill to sudo on %s', async (signal, exitCode) => {
    captureOutput();
    let sudoCalled = false;
    spyGroupKill((sent, group) => {
      if (!sudoCalled) throw errno('EPERM');
      return realKill(-group, sent);
    });
    const sudoKill = vi.fn((pid: number, sent: NodeJS.Signals) => {
      sudoCalled = true;
      return realKill(-pid, sent);
    });
    let sudoCallsAtExit: (typeof sudoKill.mock.calls)[number][] | undefined;
    let goneAtExit: boolean | undefined;
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      sudoCallsAtExit = [...sudoKill.mock.calls];
      const pid = sudoKill.mock.calls[0]?.[0];
      try {
        if (pid !== undefined) realKill(-pid, 0);
        goneAtExit = false;
      } catch (error) {
        goneAtExit = (error as NodeJS.ErrnoException).code === 'ESRCH';
      }
      return undefined as never;
    });
    const before = process.listeners(signal);
    const run = runWithRetry(options('setInterval(() => {}, 1000)', 30), sudoKill);
    try {
      const listener = process.listeners(signal).find((l) => !before.includes(l));
      if (!listener) throw new Error(`runWithRetry added no ${signal} listener`);
      await sleep(300);
      const cancelled = Date.now();
      listener(signal);
      listener(signal);
      while (exit.mock.calls.length === 0 && Date.now() - cancelled < 3000) await sleep(25);
      expect(Date.now() - cancelled).toBeLessThan(3000);
      expect(exit).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(exitCode);
      const pid = sudoKill.mock.calls[0]?.[0];
      expect(sudoCallsAtExit).toContainEqual([pid, 'SIGKILL']);
      expect(sudoKill.mock.calls.filter(([, sent]) => sent === 'SIGKILL')).toHaveLength(1);
      expect(goneAtExit).toBe(true);
      await run;
    } finally {
      vi.restoreAllMocks();
      killChildGroup(sudoKill.mock.calls[0]?.[0]);
      await run;
    }
  });
});

const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true';

/** A unique sleep duration that marks the root processes of one test run. */
const newMarker = () => `1000.${randomInt(100_000_000, 1_000_000_000)}`;

/** Runs the retry helper and collects its stdout. */
function startHelper(args: string[]) {
  const child = spawn(process.execPath, [RETRY, ...args], { stdio: ['ignore', 'pipe', 'inherit'] });
  let stdout = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  const done = new Promise<{ code: number | null; stdout: string }>((resolve) => {
    child.on('close', (code) => resolve({ code, stdout }));
  });
  return { child, done };
}

const pgrep = (pattern: string) =>
  spawnSync('pgrep', ['-f', pattern], { encoding: 'utf8' }).stdout.trim();

async function expectNoLeftovers(marker: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (pgrep(marker) !== '' && Date.now() < deadline) await sleep(100);
  expect(pgrep(marker)).toBe('');
}

/** Kills whatever a sudo test started, even when it failed partway. */
function cleanUp(child: ChildProcess, marker: string): void {
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  // The bracket class matches the marker but not this pkill's own command line.
  spawnSync('sudo', ['-n', 'pkill', '-KILL', '-f', `[1]${marker.slice(1).replace('.', '[.]')}`]);
}

describe.skipIf(!onLinuxCi)(
  'cancelling the retry helper around a hanging sudo command (Linux CI only)',
  () => {
    it.each([
      ['SIGINT', 130],
      ['SIGTERM', 143],
    ] as const)(
      'kills the root child on %s',
      async (signal, exitCode) => {
        const marker = newMarker();
        const flags = ['--attempts', '1', '--timeout-seconds', '60'];
        // exec keeps the marker in sleep's argv.
        const command = ['sudo', '-n', 'sh', '-c', 'exec sleep "$1"', 'sh', marker];
        const { child, done } = startHelper(['--label', LABEL, ...flags, '--', ...command]);
        try {
          const deadline = Date.now() + 5000;
          while (pgrep(`sleep ${marker}`) === '' && Date.now() < deadline) await sleep(50);
          expect(pgrep(`sleep ${marker}`)).not.toBe('');
          const signalled = Date.now();
          child.kill(signal);
          const { code, stdout } = await done;
          expect(Date.now() - signalled).toBeLessThan(5000);
          expect(code).toBe(exitCode);
          expect(stdout).toMatch(/retry: sent SIGKILL to process group \d+ with sudo/);
          await expectNoLeftovers(marker);
        } finally {
          cleanUp(child, marker);
        }
      },
      30_000,
    );
  },
);
