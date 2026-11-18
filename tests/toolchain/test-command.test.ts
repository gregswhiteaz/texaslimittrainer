import { describe, expect, it } from 'vitest';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const GOLDEN_PROBE = [
  "import { expect, it } from 'vitest';",
  '',
  "it('golden probe passes', () => expect(1).toBe(1));",
  '',
].join('\n');

function colocatedProbe(expected: number): string {
  return [
    "import { expect, it } from 'vitest';",
    '',
    `it('colocated probe fails', () => expect(1).toBe(${expected}));`,
    '',
  ].join('\n');
}

describe('npm test', () => {
  it(
    'npm test runs test files anywhere under tests/ and src/ and fails when one fails',
    () => {
      const failing = runInSandbox(
        {
          'tests/golden/deep/probe.test.ts': GOLDEN_PROBE,
          'src/stats/probe.test.ts': colocatedProbe(2),
        },
        'test',
      );
      expect(failing.output).toContain('golden probe passes');
      expect(failing.output).toContain('colocated probe fails');
      expect(failing.exitCode).not.toBe(0);

      const passing = runInSandbox(
        {
          'tests/golden/deep/probe.test.ts': GOLDEN_PROBE,
          'src/stats/probe.test.ts': colocatedProbe(1),
        },
        'test',
      );
      expect(passing.output).toContain('golden probe passes');
      expect(passing.output).toContain('colocated probe fails');
      expect(passing.exitCode, passing.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
