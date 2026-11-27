import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

// Asserts on YAML text without a YAML parser, like tests/ci/workflow.test.ts.
const read = (file: string) => readFileSync(join(REPO_ROOT, '.github/workflows', file), 'utf8');
const ci = read('ci.yml');
const visual = read('visual.yml');
const million = read('million.yml');

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
const runOf = (step: Step) => /^ {8}run: (.+)$/m.exec(step.body)?.[1];

const CHECKOUT = '        uses: actions/checkout@';
const SETUP_NODE =
  '        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0\n        with:\n          node-version-file: .nvmrc\n          cache: npm\n';
const NOT_SCHEDULE = "github.event_name != 'schedule'";

const EXPECTED: Record<string, { name: string; steps: string[] }> = {
  e2e: {
    name: 'E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)',
    steps: [
      'Check out',
      'Set up Node from .nvmrc',
      'Bound apt network timeouts',
      'Install dependencies',
      'Read Playwright version',
      'Read month stamp',
      'Cache Playwright browsers',
      'Restore apt archive cache',
      'Update apt index',
      'Restore apt archives',
      'Install Playwright browsers',
      'Install Playwright system dependencies',
      'Collect apt archives',
      'Save apt archive cache',
      'E2E',
      'Upload Playwright report',
    ],
  },
  checks: {
    name: 'Lint, typecheck, build and playtest',
    steps: [
      'Check out',
      'Set up Node from .nvmrc',
      'Install dependencies',
      'Audit shipped dependencies',
      'Audit all dependencies',
      'Lint',
      'Typecheck',
      'Build',
      'Playtest',
    ],
  },
  coverage: {
    name: 'Unit tests with coverage',
    steps: ['Check out', 'Set up Node from .nvmrc', 'Install dependencies', 'Test'],
  },
  sweeps: {
    name: 'Sweep tests (shard ${{ matrix.shard }} of 3)',
    steps: ['Check out', 'Set up Node from .nvmrc', 'Install dependencies', 'Sweep tests'],
  },
  changes: {
    name: 'Detect tooling changes',
    steps: ['Check out', 'Set up Node from .nvmrc', 'Detect tooling changes'],
  },
  tooling: {
    name: 'Tooling tests',
    steps: [
      'Check out',
      'Set up Node from .nvmrc',
      'Bound apt network timeouts',
      'Install dependencies',
      'Tooling tests',
    ],
  },
};

/** `owner/repo[/path]` → the distinct `<sha> # vX.Y.Z` pins used for it in `text`. */
function pins(text: string): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const [, action = '', pin = ''] of text.matchAll(/uses: ([\w./-]+)@(.+)$/gm)) {
    result.set(action, (result.get(action) ?? new Set()).add(pin));
  }
  return result;
}

describe('CI jobs', () => {
  it('ci.yml runs lint, coverage, three sweep shards, tooling and four e2e shards as parallel jobs that keep every check', () => {
    expect(jobs.map((j) => j.id)).toEqual(Object.keys(EXPECTED));
    for (const j of jobs) {
      const expected = EXPECTED[j.id];
      expect(headerValue(j, 'name'), j.id).toBe(expected?.name);
      expect(
        j.steps.map((step) => step.name),
        j.id,
      ).toEqual(expected?.steps);
      expect(headerValue(j, 'runs-on'), j.id).toBe('ubuntu-24.04');
      expect(j.steps[0]?.body.startsWith(CHECKOUT), j.id).toBe(true);
      expect(j.steps[1]?.body, j.id).toBe(SETUP_NODE);
      expect(headerValue(j, 'needs'), j.id).toBe(j.id === 'tooling' ? 'changes' : undefined);
    }

    expect(job('sweeps').header).toContain(
      '    strategy:\n      fail-fast: false\n      matrix:\n        shard: [1, 2, 3]\n',
    );
    expect(job('e2e').header).toContain(
      '    strategy:\n      fail-fast: false\n      matrix:\n        project: [chromium, webkit]\n        shard: [1, 2]\n',
    );

    const runs = new Map(jobs.map((j) => [j.id, j.steps.map(runOf)]));
    expect(runs.get('checks')).toEqual([
      undefined,
      undefined,
      'npm ci',
      'npm audit --omit=dev --audit-level=high',
      'npm audit --audit-level=high',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm run playtest -- --hands 10000 --seed 42',
    ]);
    expect(runs.get('coverage')?.slice(2)).toEqual(['npm ci', 'npm run test:unit']);
    expect(runs.get('sweeps')?.slice(2)).toEqual([
      'npm ci',
      'npm run test:sweeps -- --shard=${{ matrix.shard }}/3',
    ]);
    expect(runs.get('tooling')?.slice(2)).toEqual([
      'sudo tee -a /etc/apt/apt.conf < tools/ci/apt-network.conf > /dev/null',
      'npm ci',
      'npm run test:tooling',
    ]);
    const e2e = runs.get('e2e') ?? [];
    expect(e2e[2]).toBe('sudo tee -a /etc/apt/apt.conf < tools/ci/apt-network.conf > /dev/null');
    expect(e2e[3]).toBe('npm ci');
    expect(e2e.at(-2)).toBe(
      'npm run e2e -- --project=${{ matrix.project }} --shard=${{ matrix.shard }}/2',
    );
    expect(job('e2e').steps.at(-1)?.body).toContain(
      "        if: failure() && steps.e2e.outcome == 'failure'\n        uses: actions/upload-artifact@",
    );

    for (const line of ci.split('\n').filter((text) => /^\s*(-\s+)?uses: /.test(text))) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
    const ciPins = pins(ci);
    const visualPins = pins(visual);
    expect([...ciPins.keys()].sort()).toEqual([
      'actions/cache',
      'actions/cache/restore',
      'actions/cache/save',
      'actions/checkout',
      'actions/setup-node',
      'actions/upload-artifact',
    ]);
    for (const [action, set] of ciPins) {
      expect(set.size, action).toBe(1);
      if (visualPins.has(action)) expect(set, action).toEqual(visualPins.get(action));
    }
    const cacheShas = ['actions/cache', 'actions/cache/restore', 'actions/cache/save'].map(
      (action) => [...(ciPins.get(action) ?? [])][0],
    );
    expect(new Set(cacheShas).size).toBe(1);
  });

  it('tooling tests are gated on the changes job and always run on the schedule', () => {
    expect(ci).toContain("on:\n  push:\n  pull_request:\n  schedule:\n    - cron: '0 6 * * *'\n\n");
    expect([...ci.matchAll(/cron:/g)]).toHaveLength(1);
    expect(ci).not.toMatch(
      /^\s*(branches|branches-ignore|paths|paths-ignore|tags|tags-ignore|types):/m,
    );

    const changes = job('changes');
    expect(changes.steps[0]?.body).toMatch(
      /^ {8}uses: actions\/checkout@[0-9a-f]{40} # v[\d.]+\n {8}with:\n {10}fetch-depth: 0\n$/,
    );
    expect(changes.header).toContain(
      '    outputs:\n      tooling: ${{ steps.detect.outputs.tooling }}\n',
    );
    expect(changes.steps[2]?.body).toBe(
      [
        '        id: detect',
        '        env:',
        '          EVENT_NAME: ${{ github.event_name }}',
        '          BASE_SHA: ${{ github.event.pull_request.base.sha || github.event.before }}',
        '          HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}',
        '          DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}',
        '        run: node tools/ci/tooling-changed.js --event "$EVENT_NAME" --base "$BASE_SHA" --head "$HEAD_SHA" --default-branch "$DEFAULT_BRANCH"',
        '',
      ].join('\n'),
    );
    for (const step of changes.steps) {
      expect(runOf(step) ?? '', step.name).not.toContain('${{');
    }

    const tooling = job('tooling');
    expect(headerValue(tooling, 'needs')).toBe('changes');
    expect(headerValue(tooling, 'if')).toBe("needs.changes.outputs.tooling == 'true'");
    const names = tooling.steps.map((step) => step.name);
    expect(names.indexOf('Tooling tests')).toBeGreaterThan(names.indexOf('Install dependencies'));
    expect(names.indexOf('Install dependencies')).toBeGreaterThan(
      names.indexOf('Bound apt network timeouts'),
    );

    for (const id of ['e2e', 'checks', 'coverage', 'sweeps']) {
      expect(
        [...job(id).header.matchAll(/^ {4}if: (.+)$/gm)].map((m) => m[1]),
        id,
      ).toEqual([NOT_SCHEDULE]);
    }
    expect(headerValue(changes, 'if')).toBeUndefined();
    expect(headerValue(changes, 'needs')).toBeUndefined();
  });

  it('every job in every workflow has a 30-minute limit', () => {
    const workflows = { ci, visual, million };
    let total = 0;
    for (const [file, text] of Object.entries(workflows)) {
      for (const j of jobsOf(text)) {
        expect(
          [...j.header.matchAll(/^ {4}timeout-minutes: (\d+)$/gm)].map((m) => m[1]),
          `${file}/${j.id}`,
        ).toEqual(['30']);
      }
      total += [...text.matchAll(/^ {4}timeout-minutes: (\d+)$/gm)].length;
      for (const [, minutes] of text.matchAll(/^ {8}timeout-minutes: (\d+)$/gm)) {
        expect(Number(minutes), file).toBeLessThan(30);
      }
    }
    expect(total).toBe(6 + 2 + 1);
    expect([...ci.matchAll(/^ {8}timeout-minutes: (\d+)$/gm)].map((m) => m[1])).toEqual([
      '13',
      '13',
      '13',
    ]);
  });
});
