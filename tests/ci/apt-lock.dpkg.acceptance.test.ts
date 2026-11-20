import { spawn } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { devParts, dpkgInterrupted } from '../../tools/ci/apt-lock.js';
import { REPO_ROOT } from '../support/sandbox';

const APT_LOCK = join(REPO_ROOT, 'tools/ci/apt-lock.js');

let dir: string;
let lockFile: string;
let procLocks: string;
let marker: string;
let markerScript: string;
let updates: string;
let bin: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-apt-dpkg-'));
  lockFile = join(dir, 'lock');
  procLocks = join(dir, 'locks');
  marker = join(dir, 'marker');
  markerScript = join(dir, 'mark.js');
  updates = join(dir, 'updates');
  bin = join(dir, 'bin');
  writeFileSync(lockFile, '');
  writeFileSync(procLocks, '');
  writeFileSync(
    markerScript,
    `require('node:fs').appendFileSync(${JSON.stringify(marker)}, 'ran\\n');\n`,
  );
  mkdirSync(updates);
  mkdirSync(bin);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Puts a fake `sudo` on PATH that records its arguments in the marker file and exits `code`. */
function fakeSudo(code: number): void {
  const sudo = join(bin, 'sudo');
  writeFileSync(sudo, `#!/bin/sh\necho "sudo $*" >> ${JSON.stringify(marker)}\nexit ${code}\n`);
  chmodSync(sudo, 0o755);
}

function interrupt(): void {
  writeFileSync(join(updates, '0001'), '');
}

function runWrapper(args: string[]) {
  const env = { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` };
  const child = spawn(process.execPath, [APT_LOCK, ...args], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
  child.stderr.resume();
  return new Promise<{ code: number | null; stdout: string }>((resolve) => {
    child.on('close', (code) => resolve({ code, stdout }));
  });
}

const wrapperArgs = (updatesDir: string, wait = 5, poll?: number) => [
  '--wait-seconds',
  String(wait),
  ...(poll === undefined ? [] : ['--poll-seconds', String(poll)]),
  '--lock',
  lockFile,
  '--proc-locks',
  procLocks,
  '--dpkg-updates',
  updatesDir,
  '--',
  'node',
  markerScript,
];

describe('apt-lock dpkg recovery', () => {
  it('runs sudo -n dpkg --configure -a before the command when dpkg was interrupted', async () => {
    interrupt();
    fakeSudo(0);
    const run = await runWrapper(wrapperArgs(updates));
    expect(run.code).toBe(0);
    expect(readFileSync(marker, 'utf8')).toBe('sudo -n dpkg --configure -a\nran\n');
    expect(run.stdout).toContain('apt-lock: dpkg was interrupted');
    expect(run.stdout).toContain('apt-lock: dpkg --configure -a finished');
  });

  it('does not call sudo when the dpkg journal is empty or missing', async () => {
    fakeSudo(0);
    for (const updatesDir of [updates, join(dir, 'no-such-updates')]) {
      rmSync(marker, { force: true });
      const run = await runWrapper(wrapperArgs(updatesDir));
      expect(run.code, updatesDir).toBe(0);
      expect(readFileSync(marker, 'utf8'), updatesDir).toBe('ran\n');
      expect(run.stdout, updatesDir).not.toContain('dpkg was interrupted');
    }
  });

  it('warns and still runs the command when dpkg --configure -a fails', async () => {
    interrupt();
    fakeSudo(1);
    const run = await runWrapper(wrapperArgs(updates));
    expect(run.code).toBe(0);
    expect(run.stdout).toContain(
      `::warning::apt-lock: sudo -n dpkg --configure -a failed (exit code 1); running node ${markerScript} anyway`,
    );
    expect(readFileSync(marker, 'utf8')).toBe('sudo -n dpkg --configure -a\nran\n');
  });

  it('does not recover dpkg while an apt lock is still held', async () => {
    interrupt();
    fakeSudo(0);
    const { dev, ino } = statSync(lockFile, { bigint: true });
    const { major, minor } = devParts(dev);
    writeFileSync(
      procLocks,
      `1: POSIX  ADVISORY  WRITE ${process.pid} ${major.toString(16)}:${minor.toString(16)}:${ino} 0 EOF\n`,
    );
    const run = await runWrapper(wrapperArgs(updates, 1, 0.2));
    expect(run.code).toBe(1);
    expect(run.stdout).toContain(`::error::apt lock ${lockFile} is still held`);
    expect(run.stdout).not.toContain('dpkg was interrupted');
    expect(existsSync(marker)).toBe(false);
  });

  it('dpkgInterrupted reads the journal directory', () => {
    expect(dpkgInterrupted(updates)).toBe(false);
    expect(dpkgInterrupted(join(dir, 'no-such-updates'))).toBe(false);
    interrupt();
    expect(dpkgInterrupted(updates)).toBe(true);
  });
});
