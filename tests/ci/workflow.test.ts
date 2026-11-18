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
      'npm run e2e',
    ]);
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
    expect(workflow).toContain('run: npx playwright install --with-deps chromium webkit');
    expect(workflow).toContain('run: npx playwright install-deps chromium webkit');
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
      expect(line).toMatch(/^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
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
