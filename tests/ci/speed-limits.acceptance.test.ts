import { describe, expect, it } from 'vitest';
import { runProcessGroup } from '../support/process-group';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const PERF_FILES = ['tests/engine/hand-evaluator.perf.test.ts', 'tests/advice/equity.perf.test.ts'];
const IMPOSSIBLE_LIMITS = {
  EVALUATOR_MIN_EVALS_PER_SEC: '1e15',
  EVALUATOR_MAX_BUILD_MS: '0',
  EQUITY_PERF_SCALE: '0',
};
const TIMEOUT_MS = 120_000;
// Below the test timeout, so the nested run is killed before Vitest gives up on the test.
const NESTED_TIMEOUT_MS = 100_000;
// eslint-disable-next-line no-control-regex -- matches ANSI escape sequences
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;

/** Runs the perf suites in a nested Vitest (no coverage) and returns exit code and output. */
async function runPerfSuites(ci: boolean): Promise<{ exitCode: number; output: string }> {
  const env: NodeJS.ProcessEnv = { ...sandboxEnv(), ...IMPOSSIBLE_LIMITS };
  if (ci) env.CI = 'true';
  else delete env.CI;
  // Forced color wraps the summary counts in ANSI codes, which breaks the summary regexes.
  delete env.FORCE_COLOR;
  env.NO_COLOR = '1';
  const result = await runProcessGroup('npx', ['vitest', 'run', ...PERF_FILES], {
    cwd: REPO_ROOT,
    env,
    timeoutMs: NESTED_TIMEOUT_MS,
  });
  return { exitCode: result.exitCode, output: result.output.replace(ANSI_ESCAPE, '') };
}

describe('speed limits in CI', () => {
  it(
    'CI=true reports but does not enforce the perf limits',
    async () => {
      const { exitCode, output } = await runPerfSuites(true);
      expect(exitCode, output).toBe(0);
      expect(output).toContain('speed limits not enforced (CI=true)');
      expect(output).toContain('seven-card evals/s');
      expect(output).toMatch(/Tests\s+2 passed/);
    },
    TIMEOUT_MS,
  );

  it(
    'without CI the perf limits are enforced',
    async () => {
      const { exitCode, output } = await runPerfSuites(false);
      expect(exitCode, output).not.toBe(0);
      expect(output).toMatch(/Tests\s+2 failed/);
      expect(output).not.toContain('speed limits not enforced');
    },
    TIMEOUT_MS,
  );
});
