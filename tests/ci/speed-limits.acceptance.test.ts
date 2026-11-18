import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const PERF_FILES = ['tests/engine/hand-evaluator.perf.test.ts', 'tests/advice/equity.perf.test.ts'];
const IMPOSSIBLE_LIMITS = {
  EVALUATOR_MIN_EVALS_PER_SEC: '1e15',
  EVALUATOR_MAX_BUILD_MS: '0',
  EQUITY_PERF_SCALE: '0',
};
const TIMEOUT_MS = 120_000;

/** Runs the perf suites in a nested Vitest (no coverage) and returns exit code and output. */
function runPerfSuites(ci: boolean): { exitCode: number; output: string } {
  const env: NodeJS.ProcessEnv = { ...sandboxEnv(), ...IMPOSSIBLE_LIMITS };
  if (ci) env.CI = 'true';
  else delete env.CI;
  const result = spawnSync('npx', ['vitest', 'run', ...PERF_FILES], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env,
    timeout: TIMEOUT_MS,
  });
  return { exitCode: result.status ?? -1, output: result.stdout + result.stderr };
}

describe('speed limits in CI', () => {
  it(
    'CI=true reports but does not enforce the perf limits',
    () => {
      const { exitCode, output } = runPerfSuites(true);
      expect(exitCode, output).toBe(0);
      expect(output).toContain('speed limits not enforced (CI=true)');
      expect(output).toContain('seven-card evals/s');
      expect(output).toMatch(/Tests\s+2 passed/);
    },
    TIMEOUT_MS,
  );

  it(
    'without CI the perf limits are enforced',
    () => {
      const { exitCode, output } = runPerfSuites(false);
      expect(exitCode, output).not.toBe(0);
      expect(output).toMatch(/Tests\s+2 failed/);
      expect(output).not.toContain('speed limits not enforced');
    },
    TIMEOUT_MS,
  );
});
