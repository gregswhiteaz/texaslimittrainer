import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const CACHE_SHA = '55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0';

/** Each step's name and body (the indented lines after `- name:`), in workflow order. */
const steps = [...workflow.matchAll(/^ {6}- name: (.+)\n((?: {8}.*\n)*)/gm)].map((match) => ({
  name: match[1] ?? '',
  body: match[2] ?? '',
}));
const index = (name: string) => steps.findIndex((step) => step.name === name);
const body = (name: string) => steps[index(name)]?.body ?? '';

describe('apt archive cache', () => {
  it('verifies restored archives, saves the cache right after Collect and leaves the installs unchanged', () => {
    const cache = body('Restore apt archive cache');
    expect(cache).toContain(`uses: actions/cache/restore@${CACHE_SHA}\n`);
    expect(cache).toContain('id: apt-archives-cache\n');
    expect(cache).toContain('path: ~/.cache/apt-archives\n');
    const key = /^ {10}key: (.+)$/m.exec(cache)?.[1] ?? '';
    expect(key).toContain('steps.playwright-version.outputs.version');
    expect(key).toMatch(/^apt-archives-\$\{\{ runner\.os \}\}-pw\$\{\{ .+ \}\}-\$\{\{ .+ \}\}$/);
    const monthStep = /steps\.([\w-]+)\.outputs\.month/.exec(key)?.[1];
    const month = steps.find((step) => step.body.includes(`id: ${monthStep}\n`));
    expect(month?.body).toContain('date -u +%Y-%m');
    expect(index(month?.name ?? '')).toBeLessThan(index('Restore apt archive cache'));
    expect(cache).toContain(
      'restore-keys: apt-archives-${{ runner.os }}-pw${{ steps.playwright-version.outputs.version }}-\n',
    );

    expect(body('Update apt index')).toBe(
      '        timeout-minutes: 13\n        run: node tools/ci/retry.js --label "Update apt index" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock.js --wait-seconds 150 -- sudo apt-get update\n',
    );
    expect(body('Restore apt archives')).toBe(
      '        run: node tools/ci/apt-archives.js restore --from ~/.cache/apt-archives --to /var/cache/apt/archives\n',
    );
    expect(body('Collect apt archives')).toBe(
      '        run: node tools/ci/apt-archives.js collect --from /var/cache/apt/archives --to ~/.cache/apt-archives\n',
    );
    expect(body('Save apt archive cache')).toBe(
      [
        `        uses: actions/cache/save@${CACHE_SHA}`,
        '        with:',
        '          path: ~/.cache/apt-archives',
        '          key: ${{ steps.apt-archives-cache.outputs.cache-primary-key }}',
        '',
      ].join('\n'),
    );
    expect(index('Save apt archive cache')).toBe(index('Collect apt archives') + 1);

    const installs = ['Install Playwright browsers', 'Install Playwright system dependencies'];
    expect(index('Cache Playwright browsers')).toBeLessThan(index('Restore apt archive cache'));
    expect(index('Restore apt archive cache')).toBeLessThan(index('Update apt index'));
    expect(index('Update apt index')).toBeLessThan(index('Restore apt archives'));
    for (const install of installs) {
      expect(index('Restore apt archives'), install).toBeLessThan(index(install));
      expect(index(install), install).toBeLessThan(index('Collect apt archives'));
    }
    expect(index('Save apt archive cache')).toBeLessThan(index('E2E'));

    const aptSteps = [
      'Restore apt archive cache',
      'Update apt index',
      'Restore apt archives',
      'Collect apt archives',
      'Save apt archive cache',
    ];
    for (const name of aptSteps) {
      expect(index(name), name).toBeGreaterThanOrEqual(0);
      expect(body(name), name).not.toMatch(/^\s+if:/m);
    }
    for (const step of steps.filter((s) => s.body.includes('apt-archives'))) {
      expect(step.body, step.name).not.toContain('uses: actions/cache@');
    }
    expect(workflow).not.toMatch(/^ {6}- name: Cache apt archives$/m);

    for (const [name, command] of [
      [installs[0], 'npx playwright install --with-deps chromium webkit'],
      [installs[1], 'npx playwright install-deps chromium webkit'],
    ]) {
      expect(body(name ?? ''), name).toMatch(
        new RegExp(
          `^ {8}if: .+\\n {8}timeout-minutes: 13\\n {8}run: node tools/ci/retry\\.js --label "${name}" --attempts 3 --timeout-seconds 240 --delay-seconds 10 -- node tools/ci/apt-lock\\.js --wait-seconds 150 -- ${command}\\n$`,
        ),
      );
    }
    expect(/^ {4}timeout-minutes: (\d+)$/m.exec(workflow)?.[1]).toBe('20');
  });
});
