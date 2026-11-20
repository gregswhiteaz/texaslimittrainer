import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from './sandbox';

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

/** A Vitest probe that starts a SIGTERM-ignoring grandchild, records its pid and never finishes. */
function hangingProbe(pidFile: string): string {
  return `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';

it('hangs with a stubborn grandchild', async () => {
  const child = spawn(process.execPath, [
    '-e',
    "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
  ], { stdio: 'ignore' });
  writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));
  await new Promise(() => {});
}, 600_000);
`;
}

describe('runInSandbox timeout', () => {
  it(
    'a timed-out runInSandbox kills a grandchild that ignores SIGTERM',
    async () => {
      const dir = mkdtempSync(join(tmpdir(), 'tlh-sandbox-timeout-'));
      let grandchild = 0;
      try {
        const pidFile = join(dir, 'grandchild.pid');
        const started = Date.now();
        const result = runInSandbox(
          { 'tests/hang.test.ts': hangingProbe(pidFile) },
          'test',
          undefined,
          {
            timeoutMs: 15_000,
          },
        );
        expect(Date.now() - started).toBeLessThan(30_000);
        expect(result.timedOut, result.output).toBe(true);
        expect(result.exitCode).toBe(-1);
        expect(existsSync(pidFile), result.output).toBe(true);
        grandchild = Number(readFileSync(pidFile, 'utf8'));
        expect(grandchild).toBeGreaterThan(0);
        expect(await waitUntilGone(grandchild, 2000)).toBe(true);
      } finally {
        if (grandchild > 0 && isAlive(grandchild)) process.kill(grandchild, 'SIGKILL');
        rmSync(dir, { recursive: true, force: true });
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'returns exit code and output for a run that finishes',
    () => {
      const result = runInSandbox(
        {
          'tests/ok.test.ts':
            "import { expect, it } from 'vitest';\nit('ok', () => expect(1).toBe(1));\n",
        },
        'test',
      );
      expect(result.exitCode, result.output).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.output).toContain('ok');
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
