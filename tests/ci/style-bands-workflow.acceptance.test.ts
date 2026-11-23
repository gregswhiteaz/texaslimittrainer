import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const read = (name: string) => readFileSync(join(REPO_ROOT, '.github/workflows', name), 'utf8');
const workflow = read('style-bands.yml');
const ci = read('ci.yml');

const pinned = (text: string, action: string) =>
  [...text.matchAll(new RegExp(`uses: (${action}@[0-9a-f]{40} # v[0-9.]+)$`, 'gm'))].map(
    (match) => match[1],
  );

/** `path` as committed on main, or null when main isn't available (e.g. a shallow CI checkout). */
function onMain(path: string): string | null {
  try {
    return execFileSync('git', ['show', `main:${path}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

describe('Style-band workflow', () => {
  it('the style-band workflow runs the three 100k --check-styles seeds on manual dispatch only', () => {
    expect(workflow).toContain('\non:\n  workflow_dispatch:\n\n');
    expect(workflow).not.toMatch(/^\s*(schedule|push|pull_request|workflow_run):/m);
    expect(workflow).toContain('\npermissions:\n  contents: read\n\n');

    const jobs = workflow.slice(workflow.indexOf('\njobs:\n'));
    expect([...jobs.matchAll(/^ {2}[a-z][a-z0-9_-]*:$/gm)].map((match) => match[0])).toEqual([
      '  style-bands:',
    ]);
    expect(workflow).toContain('    runs-on: ubuntu-24.04\n');
    expect(
      [...workflow.matchAll(/^\s*timeout-minutes: ([0-9]+)$/gm)].map((match) => Number(match[1])),
    ).toEqual([60]);

    expect([...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1])).toEqual(
      ['42', '7', '1234'].map(
        (seed) =>
          `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed ${seed}`,
      ),
    );
    expect(workflow).not.toMatch(/continue-on-error|\|\| *true|^\s*if:/m);

    for (const action of ['actions/checkout', 'actions/setup-node']) {
      const fromCi = pinned(ci, action);
      expect(fromCi.length).toBeGreaterThanOrEqual(1);
      expect(new Set(fromCi).size).toBe(1);
      expect(pinned(workflow, action)).toEqual([fromCi[0]]);
    }
    expect([...workflow.matchAll(/uses: /g)]).toHaveLength(2);
    expect(workflow).toContain('node-version-file: .nvmrc\n');

    for (const name of ['ci.yml', 'million.yml', 'million-lineups.yml']) {
      const committed = onMain(`.github/workflows/${name}`);
      if (committed !== null) expect(read(name), name).toBe(committed);
    }
  });
});
