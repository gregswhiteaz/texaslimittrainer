import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  devParts,
  findHeldLock,
  parseProcLocks,
  waitForAptLocks,
} from '../../tools/ci/apt-lock.js';
import { REPO_ROOT } from '../support/sandbox';

vi.setConfig({ testTimeout: 30_000 });

const APT_LOCK = join(REPO_ROOT, 'tools/ci/apt-lock.js');
// Above Linux's maximum pid, so /proc/<pid>/comm can never be read.
const NO_SUCH_PID = 99_999_999;

let dir: string;
let lockFile: string;
let procLocks: string;
let marker: string;
let markerScript: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-apt-lock-'));
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
  const started = Date.now();
  const child = spawn(process.execPath, [APT_LOCK, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  return new Promise<{ code: number | null; stdout: string; stderr: string; ms: number }>(
    (resolve) => {
      child.on('close', (code) => resolve({ code, stdout, stderr, ms: Date.now() - started }));
    },
  );
}

const fakeArgs = (wait: number, poll?: number) => [
  '--wait-seconds',
  String(wait),
  ...(poll === undefined ? [] : ['--poll-seconds', String(poll)]),
  '--lock',
  lockFile,
  '--proc-locks',
  procLocks,
  '--',
];

describe('apt-lock', () => {
  it('runs the command at once when no apt lock is held', async () => {
    writeFileSync(procLocks, '1: POSIX  ADVISORY  WRITE 4242 08:01:1 0 EOF\n');
    for (const code of [0, 3]) {
      const run = await runWrapper([...fakeArgs(5), 'node', '-e', `process.exit(${code})`]);
      expect(run.code).toBe(code);
      expect(run.stdout).not.toContain('apt-lock: waiting');
      expect(run.ms).toBeLessThan(3000);
    }
  });

  it('waits for a held apt lock to clear, then runs the command', async () => {
    writeFileSync(procLocks, lockLine(lockFile, 4242));
    const done = runWrapper([...fakeArgs(10, 0.2), 'node', markerScript]);
    await sleep(1000);
    expect(existsSync(marker)).toBe(false);
    writeFileSync(procLocks, '');
    const run = await done;
    expect(run.code).toBe(0);
    expect(readFileSync(marker, 'utf8')).toBe('ran\n');
    const waiting = run.stdout.indexOf(
      `apt-lock: waiting up to 10 s for ${lockFile} (held by process 4242`,
    );
    const free = /apt-lock: apt locks are free after (\d+\.\d) s/.exec(run.stdout);
    expect(waiting).toBeGreaterThanOrEqual(0);
    expect(free).not.toBeNull();
    expect(free?.index).toBeGreaterThan(waiting);
    const seconds = Number(free?.[1]);
    expect(seconds).toBeGreaterThanOrEqual(0.5);
    expect(seconds).toBeLessThanOrEqual(5);
  });

  it('fails with an error naming the lock when it never clears', async () => {
    writeFileSync(procLocks, lockLine(lockFile, 4242));
    const run = await runWrapper([...fakeArgs(1, 0.2), 'node', markerScript]);
    expect(run.code).toBe(1);
    expect(run.ms).toBeLessThan(4000);
    expect(existsSync(marker)).toBe(false);
    const error = run.stdout.split('\n').find((line) => line.startsWith('::error::'));
    expect(error?.startsWith(`::error::apt lock ${lockFile} is still held by process 4242`)).toBe(
      true,
    );
    expect(error?.endsWith(`after 1 s; not running node ${markerScript}`)).toBe(true);
  });

  it('runs without waiting when /proc/locks is missing', async () => {
    const missing = join(dir, 'no-such-locks');
    const run = await runWrapper([
      '--wait-seconds',
      '5',
      '--proc-locks',
      missing,
      '--',
      'node',
      '-e',
      '',
    ]);
    expect(run.code).toBe(0);
    expect(run.stdout).toContain(`apt-lock: ${missing} not found; running without waiting`);
  });

  it('rejects invalid arguments without running the command', async () => {
    const command = ['node', markerScript];
    const cases = [
      ['--wait-seconds', '5', ...command],
      ['--wait-seconds', '5', '--'],
      ['--', ...command],
      ['--wait-seconds', '0', '--', ...command],
      ['--wait-seconds', 'abc', '--', ...command],
      ['--wait-seconds', '5', '--poll-seconds', '-1', '--', ...command],
      ['--wait-seconds', '5', '--timeout', '3', '--', ...command],
    ];
    for (const args of cases) {
      const run = await runWrapper(args);
      expect(run.code, args.join(' ')).toBe(2);
      expect(run.stderr.startsWith('apt-lock: usage:'), args.join(' ')).toBe(true);
      expect(existsSync(marker), args.join(' ')).toBe(false);
    }
  });
});

describe('parseProcLocks and findHeldLock', () => {
  it('parse holders, skip waiters and match device and inode', () => {
    const text = [
      '1: POSIX  ADVISORY  WRITE 4827 08:01:1835023 0 EOF',
      '2: OFDLCK ADVISORY  WRITE -1 103:01:42 0 EOF',
      '3: -> POSIX  ADVISORY  WRITE 999 08:01:1835023 0 EOF',
      'garbage',
    ].join('\n');
    expect(parseProcLocks(text)).toEqual([
      { pid: 4827, major: 8, minor: 1, inode: 1835023n },
      { pid: null, major: 259, minor: 1, inode: 42n },
    ]);
    expect(devParts(2049n)).toEqual({ major: 8, minor: 1 });
    expect(devParts(66305n)).toEqual({ major: 259, minor: 1 });

    const stats: Record<string, { dev: bigint; ino: bigint } | null> = {
      '/a': { dev: 2049n, ino: 7n },
      '/b': { dev: 2049n, ino: 1835023n },
      '/c': { dev: 66305n, ino: 42n },
      '/d': { dev: 66305n, ino: 1835023n },
      '/missing': null,
    };
    const statPath = (path: string) => stats[path] ?? null;
    expect(findHeldLock(['/a', '/c', '/b'], text, statPath)).toEqual({ path: '/c', pid: null });
    expect(findHeldLock(['/a', '/b', '/c'], text, statPath)).toEqual({ path: '/b', pid: 4827 });
    expect(findHeldLock(['/a', '/d', '/missing'], text, statPath)).toBeNull();
  });
});

describe('waitForAptLocks', () => {
  it('polls until the limit and names the holder', async () => {
    for (const [pid, holder] of [
      ['-1', 'an unknown process'],
      [String(NO_SUCH_PID), `process ${NO_SUCH_PID}`],
    ] as const) {
      writeFileSync(procLocks, lockLine(lockFile, Number(pid)));
      let clock = 0;
      let sleeps = 0;
      const lines: string[] = [];
      const held = await waitForAptLocks({
        lockPaths: [join(dir, 'absent'), lockFile],
        procLocksPath: procLocks,
        waitSeconds: 150,
        pollSeconds: 2,
        now: () => clock,
        sleep: (ms) => {
          sleeps++;
          clock += ms;
          return Promise.resolve();
        },
        log: (line) => lines.push(line),
      });
      expect(sleeps + 1, 'checks at t = 0, 2, ..., 150').toBe(76);
      expect(clock).toBe(150_000);
      expect(lines).toEqual([`apt-lock: waiting up to 150 s for ${lockFile} (held by ${holder})`]);
      expect(held).toEqual({
        path: lockFile,
        pid: pid === '-1' ? null : NO_SUCH_PID,
        name: null,
      });
    }
  });
});

const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true';

describe.skipIf(!onLinuxCi)('apt-lock on real Linux locks (Linux CI only)', () => {
  it('detects a real held lock and runs once it is released', async () => {
    // Detached so the whole group (flock and its sleep child, which inherits the lock) can be killed.
    const holder = spawn('flock', ['-x', lockFile, 'sleep', '30'], {
      stdio: 'ignore',
      detached: true,
    });
    const killHolder = () => {
      if (holder.pid === undefined) return;
      try {
        process.kill(-holder.pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
    };
    try {
      const inode = String(statSync(lockFile).ino);
      const deadline = Date.now() + 5000;
      const held = () =>
        readFileSync('/proc/locks', 'utf8')
          .split('\n')
          .some((line) => !line.includes('->') && line.includes(`:${inode} `));
      while (!held() && Date.now() < deadline) await sleep(50);
      expect(held()).toBe(true);

      const args = ['--lock', lockFile, '--poll-seconds', '0.2'];
      const blocked = await runWrapper([
        ...args,
        '--wait-seconds',
        '1',
        '--',
        'node',
        markerScript,
      ]);
      expect(blocked.code).toBe(1);
      expect(blocked.stdout).toContain(
        `::error::apt lock ${lockFile} is still held by process ${holder.pid} (flock)`,
      );
      expect(existsSync(marker)).toBe(false);

      const exited = new Promise((resolve) => holder.on('exit', resolve));
      killHolder();
      await exited;
      const freed = await runWrapper([...args, '--wait-seconds', '5', '--', 'node', markerScript]);
      expect(freed.code).toBe(0);
      expect(readFileSync(marker, 'utf8')).toBe('ran\n');
    } finally {
      killHolder();
    }
  });
});
