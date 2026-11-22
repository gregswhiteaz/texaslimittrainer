import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runProcessGroup } from '../support/process-group';
import { REPO_ROOT, runInSandbox, sandboxEnv, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const scripts = (
  JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts;
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');

const GROUPS = ['test:unit', 'test:sweeps', 'test:tooling'] as const;
const TOOLING_DIRS = ['tests/ci/', 'tests/git/', 'tests/toolchain/'];
const SWEEP_FILE = /\.(acceptance|perf|property)\.test\./;

/** Splits an npm script into argv, honouring single quotes (as the shell does for these scripts). */
function argv(script: string): string[] {
  return [...script.matchAll(/'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? '');
}

/** `vitest list --filesOnly` with the given filter arguments: the repo-relative test files. */
async function listFiles(args: string[]): Promise<string[]> {
  const env: NodeJS.ProcessEnv = { ...sandboxEnv(), NO_COLOR: '1' };
  delete env.FORCE_COLOR;
  const result = await runProcessGroup('npx', ['vitest', 'list', '--filesOnly', ...args], {
    cwd: REPO_ROOT,
    env,
    timeoutMs: TOOLCHAIN_TIMEOUT_MS - 20_000,
  });
  expect(result.exitCode, result.output).toBe(0);
  return result.output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[\w./-]+\.test\.tsx?$/.test(line))
    .sort();
}

/** A group script's filter arguments: `vitest run [--coverage] <args>` → `<args>`. */
function groupArgs(name: (typeof GROUPS)[number]): string[] {
  const [command, subcommand, ...rest] = argv(scripts[name] ?? '');
  expect([command, subcommand], name).toEqual(['vitest', 'run']);
  return rest.filter((arg) => arg !== '--coverage');
}

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

function probeTest(calls: string[]): string {
  return [
    "import { expect, it } from 'vitest';",
    `import { ${calls.join(', ')} } from '../src/engine/probe';`,
    '',
    ...calls.map((fn) => `it('${fn} runs', () => expect(${fn}(1)).toBeTypeOf('number'));`),
    '',
  ].join('\n');
}

describe('test groups', () => {
  it(
    'unit, sweeps and tooling partition every test file exactly once',
    async () => {
      const [all, unit, sweeps, tooling] = await Promise.all([
        listFiles([]),
        ...GROUPS.map((name) => listFiles(groupArgs(name))),
      ]);
      const groups = { unit, sweeps, tooling };
      for (const [name, files] of Object.entries(groups)) {
        expect(files?.length, name).toBeGreaterThan(0);
      }
      const union = [unit, sweeps, tooling].flatMap((files) => files ?? []);
      expect(new Set(union).size, 'groups overlap').toBe(union.length);
      expect(union.sort()).toEqual(all);

      const inToolingDirs = (all ?? []).filter((file) =>
        TOOLING_DIRS.some((dir) => file.startsWith(dir)),
      );
      expect(inToolingDirs.length).toBeGreaterThan(0);
      expect(tooling).toEqual(inToolingDirs);
      expect((unit ?? []).filter((file) => SWEEP_FILE.test(file))).toEqual([]);
      expect(sweeps?.every((file) => SWEEP_FILE.test(file))).toBe(true);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'coverage runs only in test:unit, which enforces the existing thresholds',
    () => {
      expect(argv(scripts['test:unit'] ?? '')).toContain('--coverage');
      for (const name of ['test:sweeps', 'test:tooling']) {
        expect(scripts[name], name).not.toContain('coverage');
      }

      const runs = [...ci.matchAll(/^ {6}- name: (.+)\n(?: {8}.*\n)*? {8}run: (.+)$/gm)].map(
        ([, name, run]) => ({ name, run: run ?? '' }),
      );
      expect(runs.filter(({ run }) => run.includes('test:unit'))).toEqual([
        { name: 'Test', run: 'npm run test:unit' },
      ]);
      expect(/^ {2}coverage:\n(?: {4}.*\n|\n)*? {6}- name: Test\n/m.test(ci)).toBe(true);
      for (const { name, run } of runs) {
        for (const forbidden of ['--coverage', 'npm test', 'vitest run']) {
          expect(run, name).not.toContain(forbidden);
        }
      }

      const underCovered = runInSandbox(
        { 'src/engine/probe.ts': PROBE_SOURCE, 'tests/probe.test.ts': probeTest(['covered']) },
        'test:unit',
      );
      expect(underCovered.exitCode, underCovered.output).not.toBe(0);
      expect(underCovered.output).toContain(
        'does not meet "src/{engine,bots,advice,stats,playtest,table}/**" threshold (90%)',
      );

      const covered = runInSandbox(
        {
          'src/engine/probe.ts': PROBE_SOURCE,
          'tests/probe.test.ts': probeTest(['covered', 'uncovered']),
        },
        'test:unit',
      );
      expect(covered.exitCode, covered.output).toBe(0);
      expect(covered.output).toContain('Coverage enabled with v8');
      expect(covered.output).not.toContain('ERROR: Coverage');
    },
    TOOLCHAIN_TIMEOUT_MS * 2,
  );
});
