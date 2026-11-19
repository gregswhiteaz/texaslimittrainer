import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { runProcessGroup } from './process-group';
import { REPO_ROOT } from './sandbox';

const STUB = join(REPO_ROOT, 'tests/ci/fixtures/flaky-command.js');

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

describe('runProcessGroup', () => {
  it('kills the command and its children at the timeout', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tlh-process-group-'));
    try {
      const state = join(dir, 'state');
      const started = Date.now();
      const result = await runProcessGroup(process.execPath, [STUB, state, '1', 'hang-tree'], {
        timeoutMs: 500,
      });
      expect(Date.now() - started).toBeLessThan(5000);
      expect(result).toMatchObject({ timedOut: true, exitCode: -1 });
      const grandchild = Number(readFileSync(`${state}.child`, 'utf8'));
      expect(await waitUntilGone(grandchild, 2000)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns the exit code and output', async () => {
    const script = "process.stdout.write('out'); process.stderr.write('err'); process.exit(3)";
    const result = await runProcessGroup(process.execPath, ['-e', script], { timeoutMs: 10_000 });
    expect(result).toEqual({ exitCode: 3, output: 'outerr', timedOut: false });
  });
});
