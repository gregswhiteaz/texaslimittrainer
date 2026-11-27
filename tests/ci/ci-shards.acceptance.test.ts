import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { describe, expect, it } from 'vitest';
import { assignShards } from '../../tools/ci/sweep-shards';
import weights from '../../tools/ci/sweep-weights.json' with { type: 'json' };
import { runProcessGroup } from '../support/process-group';
import { REPO_ROOT, sandboxEnv, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

// Asserts on YAML text without a YAML parser, like tests/ci/ci-jobs.acceptance.test.ts.
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const playwrightConfig = readFileSync(join(REPO_ROOT, 'playwright.config.ts'), 'utf8');
const scripts = (
  JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts;

interface Step {
  name: string;
  body: string;
}

interface Job {
  id: string;
  /** The job's 4-space-indented lines before `steps:`. */
  header: string;
  steps: Step[];
}

function jobsOf(workflow: string): Job[] {
  const section = workflow.slice(workflow.indexOf('\njobs:\n') + '\njobs:\n'.length);
  return section
    .split(/^(?= {2}[\w-]+:$)/m)
    .filter((text) => /^ {2}[\w-]+:$/m.test(text.split('\n')[0] ?? ''))
    .map((text) => {
      const id = /^ {2}([\w-]+):$/m.exec(text)?.[1] ?? '';
      const stepsAt = text.indexOf('\n    steps:\n');
      const header = stepsAt < 0 ? text : text.slice(0, stepsAt + 1);
      const steps = [...text.matchAll(/^ {6}- name: (.+)\n((?: {8}.*\n)*)/gm)].map((match) => ({
        name: match[1] ?? '',
        body: match[2] ?? '',
      }));
      return { id, header, steps };
    });
}

const jobs = jobsOf(ci);
const job = (id: string): Job => {
  const found = jobs.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no job ${id}`);
  return found;
};
const headerValue = (j: Job, key: string) =>
  new RegExp(`^ {4}${key}: (.+)$`, 'm').exec(j.header)?.[1];
const runOf = (step: Step | undefined) => /^ {8}run: (.+)$/m.exec(step?.body ?? '')?.[1];
const stepOf = (j: Job, name: string) => j.steps.find((step) => step.name === name);

/** Splits an npm script into argv, honouring single quotes (as the shell does for these scripts). */
function argv(script: string): string[] {
  return [...script.matchAll(/'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? '');
}

/** Runs `npx <args>` in the repo without colour or Vitest worker variables; returns its output lines. */
async function npxLines(args: string[]): Promise<string[]> {
  const env: NodeJS.ProcessEnv = { ...sandboxEnv(), NO_COLOR: '1' };
  delete env.FORCE_COLOR;
  const result = await runProcessGroup('npx', args, {
    cwd: REPO_ROOT,
    env,
    timeoutMs: TOOLCHAIN_TIMEOUT_MS - 20_000,
  });
  expect(result.exitCode, result.output).toBe(0);
  return stripVTControlCharacters(result.output)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** The files `npm run test:sweeps` runs, from `vitest list --filesOnly` with its filter args. */
async function sweepFiles(): Promise<string[]> {
  const [command, subcommand, ...filters] = argv(scripts['test:sweeps'] ?? '');
  expect([command, subcommand]).toEqual(['vitest', 'run']);
  const lines = await npxLines(['vitest', 'list', '--filesOnly', ...filters]);
  const files = lines.filter((line) => /^[\w./-]+\.test\.tsx?$/.test(line));
  // Every non-empty line must be a test path, so no file is silently dropped.
  expect(lines, 'unrecognised vitest list output').toEqual(files);
  return files.sort();
}

/** `playwright test --list <args>` → one `[project] › file:line:col › title` id per test. */
async function e2eTests(args: string[]): Promise<string[]> {
  const lines = await npxLines(['playwright', 'test', '--list', ...args]);
  const tests = lines.filter((line) => /^\[[\w-]+\] › /.test(line));
  const total = /^Total: (\d+) tests? in \d+ files?$/.exec(lines.at(-1) ?? '')?.[1];
  expect(Number(total), lines.join('\n')).toBe(tests.length);
  expect(new Set(tests).size, 'duplicate test ids').toBe(tests.length);
  return tests.sort();
}

const loadOf = (files: string[]) =>
  files.reduce((sum, file) => sum + ((weights as Record<string, number>)[file] ?? 1), 0);

describe('CI shards', () => {
  it('the sweeps run as three weighted shards', () => {
    const sweeps = job('sweeps');
    expect(sweeps.header).toContain(
      '    strategy:\n      fail-fast: false\n      matrix:\n        shard: [1, 2, 3]\n',
    );
    expect(headerValue(sweeps, 'name')).toBe('Sweep tests (shard ${{ matrix.shard }} of 3)');
    expect(runOf(sweeps.steps.at(-1))).toBe('npm run test:sweeps -- --shard=${{ matrix.shard }}/3');
  });

  it(
    'the sweep shards cover every sweep file exactly once',
    async () => {
      const files = await sweepFiles();
      expect(files.length).toBeGreaterThan(3);
      const groups = assignShards(files, weights, 3);
      expect(groups).toHaveLength(3);
      for (const group of groups) expect(group.length).toBeGreaterThan(0);
      const all = groups.flat();
      expect(new Set(all).size, 'a file is in two shards').toBe(all.length);
      expect(all.sort()).toEqual(files);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'no sweep shard weighs more than 1.5 times another',
    async () => {
      const loads = assignShards(await sweepFiles(), weights, 3).map(loadOf);
      expect(Math.min(...loads)).toBeGreaterThan(0);
      expect(Math.max(...loads) / Math.min(...loads), loads.join(', ')).toBeLessThanOrEqual(1.5);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('e2e runs as four jobs, two shards per browser', () => {
    const e2e = job('e2e');
    expect(e2e.header).toContain(
      '    strategy:\n      fail-fast: false\n      matrix:\n        project: [chromium, webkit]\n        shard: [1, 2]\n',
    );
    expect(headerValue(e2e, 'name')).toBe(
      'E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)',
    );
    expect(headerValue(e2e, 'needs')).toBeUndefined();

    const step = stepOf(e2e, 'E2E');
    expect(step?.body).toMatch(/^ {8}id: e2e$/m);
    expect(runOf(step)).toBe(
      'npm run e2e -- --project=${{ matrix.project }} --shard=${{ matrix.shard }}/2',
    );
    expect(runOf(stepOf(e2e, 'Install Playwright browsers'))).toMatch(
      / npx playwright install --with-deps chromium webkit$/,
    );
    expect(runOf(stepOf(e2e, 'Install Playwright system dependencies'))).toMatch(
      / npx playwright install-deps chromium webkit$/,
    );

    const projects = /^\s+project: \[(.+)\]$/m.exec(e2e.header)?.[1]?.split(', ');
    const configured = [...playwrightConfig.matchAll(/\{ name: '([\w-]+)', use:/g)].map(
      (match) => match[1],
    );
    expect(configured).toHaveLength(2);
    expect(projects).toEqual(configured);
  });

  it(
    'the e2e shards cover every test once per browser',
    async () => {
      for (const project of ['chromium', 'webkit']) {
        const all = await e2eTests([`--project=${project}`]);
        const first = await e2eTests([`--project=${project}`, '--shard=1/2']);
        const second = await e2eTests([`--project=${project}`, '--shard=2/2']);
        expect(first.length, project).toBeGreaterThan(0);
        expect(second.length, project).toBeGreaterThan(0);
        expect(
          first.filter((id) => second.includes(id)),
          `${project}: in both shards`,
        ).toEqual([]);
        expect([...first, ...second].sort(), project).toEqual(all);
        for (const id of all) expect(id.startsWith(`[${project}] › `), id).toBe(true);
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('each e2e shard uploads its own report on failure', () => {
    const upload = job('e2e').steps.at(-1);
    expect(upload?.name).toBe('Upload Playwright report');
    // Pinned to a full commit SHA, like every action (ci-jobs.acceptance.test.ts checks the pin).
    const lines = (upload?.body ?? '').split('\n');
    expect(lines[1]).toMatch(/^ {8}uses: actions\/upload-artifact@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    expect(lines.filter((_, index) => index !== 1)).toEqual([
      "        if: failure() && steps.e2e.outcome == 'failure'",
      '        with:',
      '          name: playwright-report-${{ matrix.project }}-${{ matrix.shard }}',
      '          path: playwright-report/',
      '          retention-days: 7',
      '',
    ]);
    expect(playwrightConfig).toContain("['html', { open: 'never' }]");
  });
});
