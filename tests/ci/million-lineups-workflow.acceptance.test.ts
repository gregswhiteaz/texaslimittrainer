import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/million-lineups.yml'), 'utf8');
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');

const pinned = (text: string, action: string) =>
  [...text.matchAll(new RegExp(`uses: (${action}@[0-9a-f]{40} # v[0-9.]+)$`, 'gm'))].map(
    (match) => match[1],
  );

describe('Million-hand line-up workflow', () => {
  it('the line-up million workflow runs on manual dispatch as one bounded job that fails on a non-zero exit', () => {
    expect(workflow).toContain('\non:\n  workflow_dispatch:\n\n');
    expect(workflow).not.toMatch(/^\s*(schedule|push|pull_request|workflow_run):/m);
    expect(workflow).toContain('\npermissions:\n  contents: read\n\n');

    const jobs = workflow.slice(workflow.indexOf('\njobs:\n'));
    expect([...jobs.matchAll(/^ {2}[a-z][a-z0-9_-]*:$/gm)].map((match) => match[0])).toEqual([
      '  million-lineups:',
    ]);
    expect(workflow).toContain('    runs-on: ubuntu-24.04\n');
    const timeouts = [...workflow.matchAll(/^\s*timeout-minutes: ([0-9]+)$/gm)];
    expect(timeouts.map((match) => Number(match[1]))).toEqual([30]);
    expect(Number(timeouts[0]?.[1])).toBeLessThanOrEqual(360);

    expect([...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1])).toEqual([
      'npm run playtest:million -- --lineups',
    ]);
    expect(workflow).not.toMatch(/continue-on-error|\|\| *true|^\s*if:/m);

    for (const action of ['actions/checkout', 'actions/setup-node']) {
      const fromCi = pinned(ci, action);
      expect(fromCi.length).toBeGreaterThanOrEqual(1);
      expect(new Set(fromCi).size).toBe(1);
      expect(pinned(workflow, action)).toEqual([fromCi[0]]);
    }
    expect([...workflow.matchAll(/uses: /g)]).toHaveLength(2);
    expect(workflow).toContain('node-version-file: .nvmrc\n');
  });
});
