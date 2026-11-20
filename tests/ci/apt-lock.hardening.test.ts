import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { devParts, holderText, waitForAptLocks } from '../../tools/ci/apt-lock.js';
import { REPO_ROOT } from '../support/sandbox';

const APT_LOCK = join(REPO_ROOT, 'tools/ci/apt-lock.js');
// Above Linux's maximum pid, so /proc/<pid>/comm can never be read.
const NO_SUCH_PID = 99_999_999;

let dir: string;
let lockFile: string;
let procLocks: string;
let marker: string;
let markerScript: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-apt-lock-hardening-'));
  lockFile = join(dir, 'lock');
  procLocks = join(dir, 'locks');
  marker = join(dir, 'marker');
  markerScript = join(dir, 'mark.js');
  writeFileSync(lockFile, '');
  writeFileSync(procLocks, '');
  writeFileSync(
    markerScript,
    `require('node:fs').appendFileSync(${JSON.stringify(marker)}, 'ran\\n');\n`,
  );
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** A /proc/locks line that holds `path` for `pid`. */
function lockLine(path: string, pid: number): string {
  const { dev, ino } = statSync(path, { bigint: true });
  const { major, minor } = devParts(dev);
  return `1: POSIX  ADVISORY  WRITE ${pid} ${major.toString(16)}:${minor.toString(16)}:${ino} 0 EOF\n`;
}

function runWrapper(args: string[]) {
  const child = spawn(process.execPath, [APT_LOCK, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const fakeArgs = (wait: number) => [
  '--wait-seconds',
  String(wait),
  '--lock',
  lockFile,
  '--proc-locks',
  procLocks,
  '--',
];

/** glibc's makedev (gnu_dev_makedev) with 32-bit unsigned major and minor. */
function makedev(major: number, minor: number): bigint {
  const ma = BigInt(major);
  const mi = BigInt(minor);
  return (
    ((ma & 0xfffn) << 8n) | ((ma & 0xfffff000n) << 32n) | (mi & 0xffn) | ((mi & 0xffffff00n) << 12n)
  );
}

describe('apt-lock hardening', () => {
  it('holderText replaces control characters so no workflow command can start', () => {
    const text = holderText({ path: '/x', pid: 4242, name: 'apt\n::warning::pwned\r\x1b\x7f' });
    expect(text).toBe('process 4242 (apt?::warning::pwned???)');
    expect(text).not.toMatch(/[\n\r]/);
    for (let code = 0; code < 0x20; code++) {
      expect(holderText({ path: '/x', pid: 1, name: `a${String.fromCharCode(code)}b` })).toBe(
        'process 1 (a?b)',
      );
    }
    expect(holderText({ path: '/x', pid: 4242, name: 'apt-get' })).toBe('process 4242 (apt-get)');
    expect(holderText({ path: '/x', pid: 4242, name: null })).toBe('process 4242');
    expect(holderText({ path: '/x', pid: null, name: 'apt' })).toBe('an unknown process');
  });

  it('exits 1 when the command is killed by a signal', async () => {
    const run = await runWrapper([
      ...fakeArgs(5),
      'node',
      '-e',
      "process.kill(process.pid, 'SIGKILL')",
    ]);
    expect(run.code).toBe(1);
    expect(run.stdout).toContain('was killed by SIGKILL');
  });

  it('rejects an argument before -- with a usage error', async () => {
    const run = await runWrapper(['--wait-seconds', '5', 'stray', '--', 'node', markerScript]);
    expect(run.code).toBe(2);
    expect(run.stderr).toBe('apt-lock: usage: unexpected argument "stray"\n');
    expect(existsSync(marker)).toBe(false);
  });

  it('clamps the final sleep so the last check is exactly at the limit', async () => {
    writeFileSync(procLocks, lockLine(lockFile, NO_SUCH_PID));
    for (const [waitSeconds, pollSeconds, expected] of [
      [5, 2, [2000, 2000, 1000]],
      [7, 3, [3000, 3000, 1000]],
    ] as const) {
      let clock = 0;
      const sleeps: number[] = [];
      const held = await waitForAptLocks({
        lockPaths: [lockFile],
        procLocksPath: procLocks,
        waitSeconds,
        pollSeconds,
        now: () => clock,
        sleep: (ms) => {
          sleeps.push(ms);
          clock += ms;
          return Promise.resolve();
        },
        log: () => undefined,
      });
      expect(sleeps).toEqual(expected);
      expect(clock).toBe(waitSeconds * 1000);
      expect(held).toEqual({ path: lockFile, pid: NO_SUCH_PID, name: null });
    }
  });

  it('devParts matches glibc for majors of 4096 and above', () => {
    expect(makedev(4097, 0x12345)).toBe(17592491180357n);
    expect(devParts(17592491180357n)).toEqual({ major: 4097, minor: 74565 });
    expect(devParts((4096n << 32n) | 1n)).toEqual({ major: 4096, minor: 1 });
    expect(devParts(2049n)).toEqual({ major: 8, minor: 1 });
    expect(devParts(66305n)).toEqual({ major: 259, minor: 1 });
    for (const major of [0, 8, 259, 4095, 4096, 0xfffff]) {
      for (const minor of [0, 1, 255, 256, 0xfffff, 0xffffffff]) {
        expect(devParts(makedev(major, minor)), `${major}:${minor}`).toEqual({ major, minor });
      }
    }
  });
});
