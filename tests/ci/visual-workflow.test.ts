import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/visual.yml'), 'utf8');
const SNAPSHOTS = join(REPO_ROOT, 'e2e/cards.visual.spec.ts-snapshots');

describe('visual workflow', () => {
  it('triggers on push, pull_request and workflow_dispatch with a boolean update input', () => {
    expect(workflow).toContain(
      'on:\n  push:\n  pull_request:\n  workflow_dispatch:\n    inputs:\n      update:\n',
    );
    expect(workflow).toMatch(/^ {8}type: boolean\n {8}default: false$/m);
    expect(workflow).not.toMatch(
      /^\s*(branches|branches-ignore|paths|paths-ignore|tags|tags-ignore|types):/m,
    );
  });

  it('has read-only token permissions', () => {
    expect(workflow).toContain('\npermissions:\n  contents: read\n');
    expect(workflow.match(/^\s*permissions:/gm)).toHaveLength(1);
  });

  it('runs the cards job in the Playwright Docker image matching the lockfile version', () => {
    expect(workflow).toContain(
      '    container:\n      image: mcr.microsoft.com/playwright:v${{ needs.playwright-version.outputs.version }}-noble\n      options: --user 1001\n',
    );
    expect(workflow).toContain('    needs: playwright-version\n');
    expect(workflow).toContain(
      `version=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test'].version")`,
    );
    expect(workflow).toContain(
      '[[ "$version" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]] || { echo "bad Playwright version: $version"; exit 1; }',
    );
    expect(workflow).toContain("      TLH_VISUAL_LINUX: '1'\n");
  });

  it('installs, then runs or regenerates only the card visual spec', () => {
    const commands = [...workflow.matchAll(/^\s+run: (npm .+)$/gm)].map((match) => match[1]);
    expect(commands).toEqual([
      'npm ci',
      'npm run e2e -- e2e/cards.visual.spec.ts',
      'npm run e2e -- e2e/cards.visual.spec.ts --update-snapshots=all',
    ]);
  });

  it('pins every action to a full commit SHA', () => {
    const usesLines = workflow.split('\n').filter((line) => /^\s*(-\s+)?uses: /.test(line));
    expect(usesLines.length).toBeGreaterThan(0);
    for (const line of usesLines) {
      expect(line).toMatch(/^\s*(-\s+)?uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
  });

  it('never ignores a failing check', () => {
    for (const forbidden of ['continue-on-error', '|| true', 'set +e']) {
      expect(workflow).not.toContain(forbidden);
    }
  });

  it('has committed Linux baselines for every card snapshot', () => {
    const missing = ['faces-two-colour', 'faces-four-colour', 'card-back']
      .flatMap((name) => ['chromium', 'webkit'].map((project) => `${name}-${project}-linux.png`))
      .filter((file) => !existsSync(join(SNAPSHOTS, file)));
    expect(missing).toEqual([]);
  });
});
