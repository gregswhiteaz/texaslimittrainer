import { spawn, spawnSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { killGroup } from '../../tools/ci/retry.js';
import { REPO_ROOT } from '../support/sandbox';

const RETRY = join(REPO_ROOT, 'tools/ci/retry.js');
const LABEL = 'Install Playwright system dependencies';

function errno(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

describe('killGroup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
});

const onLinuxCi = process.platform === 'linux' && process.env.CI === 'true';

describe.skipIf(!onLinuxCi)('retry helper around a hanging sudo command (Linux CI only)', () => {
  it('times out both attempts, fails, and leaves no sudo child behind', async () => {
    // A unique sleep duration marks sudo, sh and sleep itself (exec keeps it in sleep's argv).
    const marker = `1000.${randomInt(100_000_000, 1_000_000_000)}`;
    const args = [
      RETRY,
      '--label',
      LABEL,
      '--attempts',
      '2',
      '--timeout-seconds',
      '2',
      '--delay-seconds',
      '0',
      '--',
      'sudo',
      '-n',
      'sh',
      '-c',
      'exec sleep "$1"',
      'sh',
      marker,
    ];
    const started = Date.now();
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    const code = await new Promise<number | null>((resolve) => child.on('close', resolve));
    const ms = Date.now() - started;

    expect(stdout.match(/::warning::.*timed out after 2 s/g)).toHaveLength(2);
    expect(code).toBe(1);
    expect(stdout.trimEnd().split('\n').at(-1)).toBe(`::error::${LABEL} failed after 2 attempts`);
    expect(ms).toBeLessThan(20_000);
    const leftovers = () => spawnSync('pgrep', ['-f', marker], { encoding: 'utf8' }).stdout.trim();
    const deadline = Date.now() + 2000;
    while (leftovers() !== '' && Date.now() < deadline) await sleep(100);
    expect(leftovers()).toBe('');
  }, 30_000);
});
