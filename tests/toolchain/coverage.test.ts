import { describe, expect, it } from 'vitest';
import { HEADLESS_DIRS } from '../../tools/lint/headless-boundary.js';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

/** Two functions: `covered` (3 lines) and `uncovered` (5 lines). */
const PROBE_SOURCE = [
  'export function covered(n: number): number {',
  '  return n + 1;',
  '}',
  '',
  'export function uncovered(n: number): number {',
  '  const a = n * 2;',
  '  const b = a + 3;',
  '  return b;',
  '}',
  '',
].join('\n');

function probeTest(modulePath: string, calls: string[]): string {
  return [
    "import { expect, it } from 'vitest';",
    `import { ${calls.join(', ')} } from '${modulePath}';`,
    '',
    ...calls.map((fn) => `it('${fn} runs', () => expect(${fn}(1)).toBeTypeOf('number'));`),
    '',
  ].join('\n');
}

/** 40 straight-line statements, all covered by FILLER_TEST. */
const FILLER_SOURCE = [
  'export function filler(): number {',
  '  let total = 0;',
  ...Array.from({ length: 40 }, (_, i) => `  total += ${i + 1};`),
  '  return total;',
  '}',
  '',
].join('\n');

const FILLER_TEST = [
  "import { expect, it } from 'vitest';",
  "import { filler } from '../src/ui/filler';",
  '',
  "it('filler runs', () => expect(filler()).toBe(820));",
  '',
].join('\n');

describe('coverage thresholds via npm test', () => {
  it(
    'npm test fails and names the 90% headless threshold when a headless folder is under-covered',
    () => {
      expect(HEADLESS_DIRS).toEqual(expect.arrayContaining(['playtest', 'table']));
      for (const dir of HEADLESS_DIRS) {
        const result = runInSandbox(
          {
            [`src/${dir}/probe.ts`]: PROBE_SOURCE,
            'tests/probe.test.ts': probeTest(`../src/${dir}/probe`, ['covered']),
            'src/ui/filler.ts': FILLER_SOURCE,
            'tests/filler.test.ts': FILLER_TEST,
          },
          'test',
        );

        expect(result.exitCode, `${dir}: ${result.output}`).not.toBe(0);
        expect(result.output).toContain(
          'does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)',
        );
        expect(result.output).not.toContain('global threshold');
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'npm test fails and names the 70% global threshold when overall coverage is low',
    () => {
      const result = runInSandbox(
        {
          'src/ui/probe.ts': PROBE_SOURCE,
          'tests/probe.test.ts': probeTest('../src/ui/probe', ['covered']),
        },
        'test',
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain('does not meet global threshold (70%)');
      expect(result.output).not.toContain('threshold (90%)');
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'npm test passes when both coverage thresholds are met',
    () => {
      const result = runInSandbox(
        {
          'src/engine/probe.ts': PROBE_SOURCE,
          'tests/probe.test.ts': probeTest('../src/engine/probe', ['covered', 'uncovered']),
        },
        'test',
      );

      expect(result.exitCode, result.output).toBe(0);
      expect(result.output).not.toContain('ERROR: Coverage');
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
