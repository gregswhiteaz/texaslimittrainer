import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { groupExists, killGroup, runWithRetry } from '../../tools/ci/retry.js';
import { REPO_ROOT } from '../support/sandbox';

vi.setConfig({ testTimeout: 30_000 });

const RETRY = join(REPO_ROOT, 'tools/ci/retry.js');
const LABEL = 'Install Playwright system dependencies';

function errno(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('killGroup', () => {
  it.each(['EPERM', 'ESRCH'])('does not throw when the group kill fails with %s', (code) => {
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw errno(code);
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    expect(() => killGroup(4242, 'SIGTERM')).not.toThrow();
    expect(kill).toHaveBeenCalledWith(-4242, 'SIGTERM');
  });

  it('rethrows any other error', () => {
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw errno('EINVAL');
    });
    expect(() => killGroup(4242, 'SIGTERM')).toThrow('EINVAL');
  });

  it('returns sent, gone or denied', () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    expect(killGroup(4242, 'SIGTERM')).toBe('sent');
    kill.mockImplementationOnce(() => {
      throw errno('ESRCH');
    });
    expect(killGroup(4242, 'SIGTERM')).toBe('gone');
    kill.mockImplementationOnce(() => {
      throw errno('EPERM');
    });
    expect(killGroup(4242, 'SIGTERM')).toBe('denied');
    expect(killGroup(undefined, 'SIGKILL')).toBe('gone');
  });
});

describe('groupExists', () => {
  it('treats EPERM as existing and ESRCH as gone', () => {
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    expect(groupExists(4242)).toBe(true);
    expect(kill).toHaveBeenCalledWith(-4242, 0);
    kill.mockImplementationOnce(() => {
      throw errno('EPERM');
    });
    expect(groupExists(4242)).toBe(true);
    kill.mockImplementationOnce(() => {
      throw errno('ESRCH');
    });
    expect(groupExists(4242)).toBe(false);
    kill.mockImplementation(() => {
      throw errno('EINVAL');
    });
    expect(() => groupExists(4242)).toThrow('EINVAL');
  });
});

describe('stopping an attempt', () => {
  const realKill = process.kill.bind(process);
  const options = {
    label: LABEL,
    delaySeconds: 0,
    timeoutSeconds: 0.3,
    command: process.execPath,
    args: ['-e', 'setInterval(() => {}, 1000)'],
  };

  /** Captures the helper's log lines. */
  function captureOutput(): () => string {
    let output = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk);
      return true;
    });
    return () => output;
  }

  it('ends at once with an error when the attempt cannot be killed', async () => {
    const output = captureOutput();
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw errno('EPERM');
    });
    let pid: number | undefined;
    const sudoKill = vi.fn((groupPid: number) => {
      pid = groupPid;
      return false;
    });
    const started = Date.now();
    try {
      const code = await runWithRetry({ ...options, attempts: 3, killAfterSeconds: 0.3 }, sudoKill);
      expect(code).toBe(1);
      expect(Date.now() - started).toBeLessThan(5000);
      expect(output()).toContain(
        `::error::${LABEL}: attempt 1 of 3 could not be stopped; process group ${pid} is still running`,
      );
      expect(output()).not.toContain('attempt 2 of 3');
      expect(sudoKill).toHaveBeenCalledWith(pid, 'SIGTERM');
      expect(sudoKill).toHaveBeenCalledWith(pid, 'SIGKILL');
    } finally {
      vi.restoreAllMocks();
      killGroup(pid, 'SIGKILL');
    }
  });

  it('sends the signal with sudo when the group kill is denied', async () => {
    const output = captureOutput();
    let sudoCalled = false;
    vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
      if (!sudoCalled) throw errno('EPERM');
      return realKill(pid, signal);
    });
    const sudoKill = vi.fn((pid: number, signal: NodeJS.Signals) => {
      sudoCalled = true;
      return realKill(-pid, signal);
    });
    const started = Date.now();
    try {
      const code = await runWithRetry({ ...options, attempts: 1, killAfterSeconds: 5 }, sudoKill);
      expect(sudoKill.mock.calls[0]?.[1]).toBe('SIGTERM');
      expect(code).toBe(1);
      expect(Date.now() - started).toBeLessThan(3000);
      expect(output().trimEnd().split('\n').at(-1)).toBe(
        `::error::${LABEL} failed after 1 attempts`,
      );
      expect(output()).not.toContain('could not be stopped');
    } finally {
      vi.restoreAllMocks();
      killGroup(sudoKill.mock.calls[0]?.[0], 'SIGKILL');
    }
  });
});

const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true';

/** A unique sleep duration that marks the root processes of one test run. */
const newMarker = () => `1000.${randomInt(100_000_000, 1_000_000_000)}`;

/** Runs the retry helper and collects its stdout. */
function startHelper(args: string[]) {
  const started = Date.now();
  const child = spawn(process.execPath, [RETRY, ...args], { stdio: ['ignore', 'pipe', 'inherit'] });
  let stdout = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  const done = new Promise<{ code: number | null; stdout: string; ms: number }>((resolve) => {
    child.on('close', (code) => resolve({ code, stdout, ms: Date.now() - started }));
  });
  return { child, done };
}

async function expectNoLeftovers(marker: string, message?: string): Promise<void> {
  const leftovers = () => spawnSync('pgrep', ['-f', marker], { encoding: 'utf8' }).stdout.trim();
  const deadline = Date.now() + 2000;
  while (leftovers() !== '' && Date.now() < deadline) await sleep(100);
  expect(leftovers(), message).toBe('');
}

/** The `ps` lines for this test's marker and for sudo, so a failing CI log shows the group layout. */
function processLayout(marker: string): string {
  const ps = spawnSync('ps', ['-eo', 'pid,ppid,pgid,sid,user,args'], { encoding: 'utf8' }).stdout;
  const [header = '', ...lines] = ps.split('\n');
  return [header, ...lines.filter((line) => line.includes(marker) || line.includes('sudo'))].join(
    '\n',
  );
}

/** Kills whatever a sudo test started, even when it failed partway. */
function cleanUp(child: ChildProcess, marker: string, dir?: string): void {
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  // The bracket class matches the marker but not this pkill's own command line.
  spawnSync('sudo', ['-n', 'pkill', '-KILL', '-f', `[1]${marker.slice(1).replace('.', '[.]')}`]);
  if (dir) rmSync(dir, { recursive: true, force: true });
}

describe.skipIf(!onLinuxCi)('retry helper around a hanging sudo command (Linux CI only)', () => {
  it('times out both attempts, fails, and leaves no sudo child behind', async () => {
    const marker = newMarker();
    const flags = ['--attempts', '2', '--timeout-seconds', '2', '--delay-seconds', '0'];
    // exec keeps the marker in sleep's argv.
    const command = ['sudo', '-n', 'sh', '-c', 'exec sleep "$1"', 'sh', marker];
    const { child, done } = startHelper(['--label', LABEL, ...flags, '--', ...command]);
    try {
      const { code, stdout, ms } = await done;
      expect(stdout.match(/::warning::.*timed out after 2 s/g)).toHaveLength(2);
      expect(code).toBe(1);
      expect(stdout.trimEnd().split('\n').at(-1)).toBe(`::error::${LABEL} failed after 2 attempts`);
      expect(ms).toBeLessThan(20_000);
      await expectNoLeftovers(marker);
    } finally {
      cleanUp(child, marker);
    }
  }, 30_000);

  it('stops a root process left behind by its sudo parent before the next attempt', async () => {
    const marker = newMarker();
    const dir = mkdtempSync(join(tmpdir(), 'tlh-retry-sudo-'));
    const flags = ['--attempts', '2', '--timeout-seconds', '2', '--delay-seconds', '0'];
    // `; true` keeps sh as the parent, so the root flock and sleep outlive sudo's relayed SIGTERM.
    const script = 'flock -n "$1" sleep "$2"; true';
    const command = ['sudo', '-n', 'sh', '-c', script, 'sh', join(dir, 'lock'), marker];
    const { child, done } = startHelper(['--label', LABEL, ...flags, '--', ...command]);
    try {
      // Taken while the first attempt runs, before its 2 s timeout.
      await sleep(1000);
      const during = processLayout(marker);
      const { code, stdout, ms } = await done;
      const why = `process layout during attempt 1:\n${during}\n\nafter the helper exited:\n${processLayout(marker)}`;
      expect(stdout.match(/::warning::.*timed out after 2 s/g), why).toHaveLength(2);
      expect(stdout, why).not.toContain('succeeded');
      // The root orphan must stay in the attempt's group and be stopped by the sudo fallback.
      expect(stdout, why).toMatch(
        /retry: could not send SIG(TERM|KILL) to process group \d+ \(EPERM\)/,
      );
      expect(stdout, why).toMatch(/retry: sent SIGKILL to process group \d+ with sudo/);
      expect(code, why).toBe(1);
      expect(stdout.trimEnd().split('\n').at(-1), why).toBe(
        `::error::${LABEL} failed after 2 attempts`,
      );
      expect(ms, why).toBeLessThan(20_000);
      await expectNoLeftovers(marker, why);
    } finally {
      cleanUp(child, marker, dir);
    }
  }, 30_000);
});
