import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const nvmrc = readFileSync(join(REPO_ROOT, '.nvmrc'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
  engines: { node: string };
};

function parseVersion(version: string, pattern: RegExp): number[] {
  const match = pattern.exec(version);
  if (!match) throw new Error(`Not a version: ${version}`);
  return match.slice(1, 4).map(Number);
}

function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

describe('CI workflow', () => {
  it('triggers on every push and every pull request without branch or path filters', () => {
    expect(workflow).toContain('on:\n  push:\n  pull_request:\n');
    expect(workflow).not.toMatch(
      /^\s*(branches|branches-ignore|paths|paths-ignore|tags|tags-ignore|types):/m,
    );
  });

  it('runs install, audits, lint, typecheck, build, test and e2e in that order', () => {
    const commands = [...workflow.matchAll(/^\s+run: (npm .+)$/gm)].map((match) => match[1]);
    expect(commands).toEqual([
      'npm ci',
      'npm audit --omit=dev --audit-level=high',
      'npm audit --audit-level=critical',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm test',
      'npm run playtest -- --hands 10000 --seed 42',
      'npm run e2e',
    ]);
  });

  it('runs a 10,000-hand playtest step that fails the job on a non-zero exit', () => {
    const step = /^ {6}- name: Playtest\n((?: {8}.+\n)+)/m.exec(workflow);
    expect(step).not.toBeNull();
    expect(step?.[1]).toBe('        run: npm run playtest -- --hands 10000 --seed 42\n');
    const commands = [...workflow.matchAll(/^\s+run: (npm .+)$/gm)].map((match) => match[1]);
    const playtest = commands.indexOf('npm run playtest -- --hands 10000 --seed 42');
    expect(playtest).toBeGreaterThan(commands.indexOf('npm test'));
    expect(playtest).toBeLessThan(commands.indexOf('npm run e2e'));
    for (const forbidden of ['if:', 'continue-on-error', '|| true']) {
      expect(step?.[0]).not.toContain(forbidden);
    }
  });

  it('never ignores a failing check', () => {
    for (const forbidden of ['continue-on-error', '|| true', 'set +e']) {
      expect(workflow).not.toContain(forbidden);
    }
    const conditions = workflow
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('if:'));
    expect(conditions).toEqual([
      "if: steps.playwright-cache.outputs.cache-hit != 'true'",
      "if: steps.playwright-cache.outputs.cache-hit == 'true'",
      "if: failure() && steps.e2e.outcome == 'failure'",
    ]);
  });

  it('installs Chromium and WebKit for the Playwright and axe tests', () => {
    for (const command of [
      'npx playwright install --with-deps chromium webkit',
      'npx playwright install-deps chromium webkit',
    ]) {
      const line = workflow.split('\n').find((text) => text.endsWith(` -- ${command}`));
      expect(line?.trim().startsWith('run: node tools/ci/retry.js '), command).toBe(true);
    }
    expect(workflow).not.toMatch(/^\s+run: npx playwright/m);
  });

  it('gives each Playwright install attempt a timeout well below the job timeout and retries it', () => {
    const jobTimeout = Number(/^ {4}timeout-minutes: (\d+)$/m.exec(workflow)?.[1]);
    expect(jobTimeout).toBe(20);
    const steps = [
      ['Install Playwright browsers', 'npx playwright install --with-deps chromium webkit'],
      ['Install Playwright system dependencies', 'npx playwright install-deps chromium webkit'],
    ];
    for (const [name, command] of steps) {
      const step = new RegExp(
        `^ {6}- name: ${name}\\n {8}if: .+\\n {8}timeout-minutes: (\\d+)\\n {8}run: (.+)$`,
        'm',
      ).exec(workflow);
      expect(step, name).not.toBeNull();
      const [, stepTimeout = '', run = ''] = step ?? [];
      expect(run).toBe(
        `node tools/ci/retry.js --label "${name}" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- ${command}`,
      );
      const flag = (flagName: string) => Number(new RegExp(`--${flagName} (\\S+)`).exec(run)?.[1]);
      const [attempts, timeoutSeconds, delaySeconds] = [
        flag('attempts'),
        flag('timeout-seconds'),
        flag('delay-seconds'),
      ];
      expect(attempts, name).toBeGreaterThanOrEqual(3);
      expect(timeoutSeconds, name).toBeLessThanOrEqual(300);
      // Each attempt may also use the helper's 10 s SIGTERM -> SIGKILL grace.
      const worstCase = attempts * timeoutSeconds + (attempts - 1) * delaySeconds + attempts * 10;
      expect(worstCase, name).toBeLessThanOrEqual(Number(stepTimeout) * 60);
      expect(Number(stepTimeout), name).toBeLessThan(jobTimeout);
    }
  });

  it('waits for the apt lock inside each Playwright install attempt within the step budget', () => {
    expect(Number(/^ {4}timeout-minutes: (\d+)$/m.exec(workflow)?.[1])).toBe(20);
    for (const [name, command] of [
      ['Install Playwright browsers', 'npx playwright install --with-deps chromium webkit'],
      ['Install Playwright system dependencies', 'npx playwright install-deps chromium webkit'],
    ]) {
      const step = new RegExp(
        `^ {6}- name: ${name}\\n {8}if: .+\\n {8}timeout-minutes: (\\d+)\\n {8}run: (.+)$`,
        'm',
      ).exec(workflow);
      expect(step, name).not.toBeNull();
      const [, stepTimeout = '', run = ''] = step ?? [];
      expect(Number(stepTimeout), name).toBe(13);
      const wiring =
        /^node tools\/ci\/retry\.js --label "(.+)" --attempts (\d+) --timeout-seconds (\d+) --delay-seconds (\d+) -- node tools\/ci\/apt-lock\.js --wait-seconds (\d+) -- (.+)$/.exec(
          run,
        );
      expect(wiring, name).not.toBeNull();
      const [, label, ...rest] = wiring ?? [];
      const [attempts = 0, timeoutSeconds = 0, delaySeconds = 0, waitSeconds = 0] = rest
        .slice(0, 4)
        .map(Number);
      expect([label, rest[4]], name).toEqual([name, command]);
      expect([attempts, timeoutSeconds, delaySeconds, waitSeconds], name).toEqual([
        3, 240, 10, 150,
      ]);
      expect(waitSeconds, name).toBeGreaterThanOrEqual(60);
      // Leave at least 60 s of each attempt for the install itself (green installs take 32-45 s).
      expect(waitSeconds + 60, name).toBeLessThanOrEqual(timeoutSeconds);
      // A lock that never clears: every attempt waits (+10 s for polling) and gives up.
      const neverClears = attempts * (waitSeconds + 10) + (attempts - 1) * delaySeconds;
      expect(neverClears, name).toBeLessThanOrEqual(Number(stepTimeout) * 60);
    }
  });

  it('uses the Node version pinned in .nvmrc with the npm cache', () => {
    expect(workflow).toContain('node-version-file: .nvmrc');
    expect(workflow).toContain('cache: npm');

    const pinned = parseVersion(nvmrc.trim(), /^(\d+)\.(\d+)\.(\d+)$/);
    expect((pinned[0] ?? 1) % 2, 'an LTS line has an even major version').toBe(0);
    const minimum = parseVersion(packageJson.engines.node, /^>=(\d+)\.(\d+)\.(\d+)$/);
    expect(compareVersions(pinned, minimum)).toBeGreaterThanOrEqual(0);
  });

  it('pins every action to a full commit SHA', () => {
    const usesLines = workflow.split('\n').filter((line) => /^\s*(-\s+)?uses: /.test(line));
    expect(usesLines.length).toBeGreaterThan(0);
    for (const line of usesLines) {
      expect(line).toMatch(
        /^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40} # v\d+\.\d+\.\d+$/,
      );
    }
  });

  it('has read-only token permissions, a job timeout and the named check steps', () => {
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).toContain('timeout-minutes: 20');
    expect(workflow).toContain('runs-on: ubuntu-24.04');
    for (const step of ['Lint', 'Typecheck', 'Build', 'Test', 'E2E']) {
      expect(workflow).toMatch(new RegExp(`^\\s*- name: ${step}$`, 'm'));
    }
  });

  it('runs each audit gate as its own named step', () => {
    expect(workflow).toContain(
      '- name: Audit shipped dependencies\n        run: npm audit --omit=dev --audit-level=high\n',
    );
    expect(workflow).toContain(
      '- name: Audit all dependencies\n        run: npm audit --audit-level=critical\n',
    );
  });
});
