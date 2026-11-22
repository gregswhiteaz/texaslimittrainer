import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const RETRY = join(REPO_ROOT, 'tools/ci/retry.js');
const STUB = join(REPO_ROOT, 'tests/ci/fixtures/flaky-command.js');
const LABEL = 'Install Playwright system dependencies';

let dir: string;
let stateFile: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-retry-'));
  stateFile = join(dir, 'state');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function stub(failures: number, mode: string): string[] {
  return ['node', STUB, stateFile, String(failures), mode];
}

/** `--label LABEL`, the given numeric flags, `--`, then the command. */
function retryArgs(flags: Record<string, number>, command: string[]): string[] {
  const flagArgs = Object.entries(flags).flatMap(([name, value]) => [`--${name}`, String(value)]);
  return ['--label', LABEL, ...flagArgs, '--', ...command];
}

function startHelper(args: string[]) {
  const started = Date.now();
  const child = spawn(process.execPath, [RETRY, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  const done = new Promise<{ code: number | null; stdout: string; stderr: string; ms: number }>(
    (resolve) => {
      child.on('close', (code) => resolve({ code, stdout, stderr, ms: Date.now() - started }));
    },
  );
  return { child, done };
}

const runHelper = (args: string[]) => startHelper(args).done;
const calls = () => readFileSync(stateFile, 'utf8');

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
    throw error;
  }
}

async function waitUntilGone(pid: number, withinMs: number): Promise<boolean> {
  const deadline = Date.now() + withinMs;
  while (isAlive(pid) && Date.now() < deadline) await sleep(50);
  return !isAlive(pid);
}

describe('retry helper', () => {
  it('runs a succeeding command once without delay', async () => {
    const flags = { attempts: 3, 'timeout-seconds': 5, 'delay-seconds': 10 };
    const run = await runHelper(retryArgs(flags, stub(0, 'fail')));
    expect(run.code).toBe(0);
    expect(calls()).toBe('1');
    expect(run.stdout).toContain('attempt 1 of 3: node');
    expect(run.stdout).toContain('attempt 1 of 3 succeeded in');
    expect(run.stdout).not.toContain('attempt 2');
    expect(run.ms).toBeLessThan(3000);
  });

  it('retries a failing command until it succeeds', async () => {
    const flags = { attempts: 3, 'timeout-seconds': 5, 'delay-seconds': 0 };
    const run = await runHelper(retryArgs(flags, stub(2, 'fail')));
    expect(run.code).toBe(0);
    expect(calls()).toBe('3');
    for (const attempt of [1, 2]) {
      expect(run.stdout).toContain(
        `::warning::${LABEL}: attempt ${attempt} of 3 failed with exit code 3; retrying in 0 s`,
      );
    }
    expect(run.stdout).toContain('attempt 3 of 3 succeeded in');
  });

  it('kills a hanging attempt at its timeout and retries', async () => {
    const flags = { attempts: 3, 'timeout-seconds': 0.5, 'delay-seconds': 0 };
    const run = await runHelper(retryArgs(flags, stub(2, 'hang')));
    expect(run.code).toBe(0);
    expect(calls()).toBe('3');
    expect(run.stdout).toContain('attempt 1 of 3 timed out after 0.5 s; retrying in 0 s');
    expect(run.stdout).toContain('attempt 2 of 3 timed out after 0.5 s; retrying in 0 s');
    expect(run.ms).toBeLessThan(10_000);
  });

  it('fails with an error naming the step after the last attempt fails', async () => {
    for (const mode of ['fail', 'hang']) {
      rmSync(stateFile, { force: true });
      const flags = { attempts: 3, 'timeout-seconds': 0.5, 'delay-seconds': 0 };
      const run = await runHelper(retryArgs(flags, stub(99, mode)));
      expect(run.code, mode).toBe(1);
      expect(calls(), mode).toBe('3');
      expect(run.stdout.trimEnd().split('\n').at(-1), mode).toBe(
        `::error::${LABEL} failed after 3 attempts`,
      );
    }
  });

  it('kills the grandchildren of a timed-out attempt', async () => {
    await runHelper(retryArgs({ attempts: 1, 'timeout-seconds': 0.5 }, stub(1, 'hang-tree')));
    const grandchild = Number(readFileSync(`${stateFile}.child`, 'utf8'));
    expect(await waitUntilGone(grandchild, 2000)).toBe(true);
  });

  it('force-kills an attempt that ignores SIGTERM', async () => {
    const flags = { attempts: 1, 'timeout-seconds': 0.5, 'kill-after-seconds': 0.5 };
    const run = await runHelper(retryArgs(flags, stub(1, 'hang-ignore-term')));
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('attempt 1 of 1 timed out after 0.5 s');
    expect(run.ms).toBeLessThan(5000);
  });

  it('kills the running attempt when it is cancelled', async () => {
    const flags = { attempts: 3, 'timeout-seconds': 30 };
    const { child, done } = startHelper(retryArgs(flags, stub(1, 'hang-tree')));
    const childFile = `${stateFile}.child`;
    const deadline = Date.now() + 5000;
    while (!existsSync(childFile) || readFileSync(childFile, 'utf8') === '') {
      if (Date.now() > deadline) throw new Error('the stub did not start its grandchild');
      await sleep(25);
    }
    const grandchild = Number(readFileSync(childFile, 'utf8'));
    child.kill('SIGTERM');
    expect((await done).code).toBe(143);
    expect(await waitUntilGone(grandchild, 2000)).toBe(true);
  });

  it('rejects invalid arguments without running the command', async () => {
    const label = ['--label', LABEL];
    const command = ['--', ...stub(0, 'fail')];
    const flags = (attempts: string, timeout: string) => [
      '--attempts',
      attempts,
      '--timeout-seconds',
      timeout,
    ];
    const cases: Record<string, string[]> = {
      'no command': [...label, ...flags('3', '1')],
      'empty command': [...label, ...flags('3', '1'), '--'],
      'attempts 0': [...label, ...flags('0', '1'), ...command],
      'attempts 1.5': [...label, ...flags('1.5', '1'), ...command],
      'timeout 0': [...label, ...flags('3', '0'), ...command],
      'timeout abc': [...label, ...flags('3', 'abc'), ...command],
      'missing label': [...flags('3', '1'), ...command],
      'unknown flag': [...label, ...flags('3', '1'), '--retries', '3', ...command],
    };
    for (const [name, args] of Object.entries(cases)) {
      const run = await runHelper(args);
      expect(run.code, name).toBe(2);
      expect(run.stderr.startsWith('retry: usage:'), `${name}: ${run.stderr}`).toBe(true);
      expect(existsSync(stateFile), name).toBe(false);
    }
  });
});
