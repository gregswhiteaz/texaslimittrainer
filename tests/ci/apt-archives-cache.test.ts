import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const CACHE_ACTION = 'actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0';

/** Each step's name and body (the indented lines after `- name:`), in workflow order. */
const steps = [...workflow.matchAll(/^ {6}- name: (.+)\n((?: {8}.*\n)*)/gm)].map((match) => ({
  name: match[1] ?? '',
  body: match[2] ?? '',
}));
const index = (name: string) => steps.findIndex((step) => step.name === name);
const body = (name: string) => steps[index(name)]?.body ?? '';

describe('apt archive cache', () => {
  it('caches apt archives around both Playwright install steps without touching their run lines', () => {
    const cache = body('Cache apt archives');
    expect(cache).toContain(`uses: ${CACHE_ACTION}`);
    expect(cache).toContain('path: ~/.cache/apt-archives\n');
    const key = /^ {10}key: (.+)$/m.exec(cache)?.[1] ?? '';
    expect(key).toContain('steps.playwright-version.outputs.version');
    expect(key).toMatch(/^apt-archives-\$\{\{ runner\.os \}\}-pw\$\{\{ .+ \}\}-\$\{\{ .+ \}\}$/);
    const monthStep = /steps\.([\w-]+)\.outputs\.month/.exec(key)?.[1];
    const month = steps.find((step) => step.body.includes(`id: ${monthStep}\n`));
    expect(month?.body).toContain('date -u +%Y-%m');
    expect(index(month?.name ?? '')).toBeLessThan(index('Cache apt archives'));
    expect(cache).toContain(
      'restore-keys: apt-archives-${{ runner.os }}-pw${{ steps.playwright-version.outputs.version }}-\n',
    );

    expect(body('Restore apt archives')).toContain(
      "find ~/.cache/apt-archives -maxdepth 1 -name '*.deb' -exec sudo cp -t /var/cache/apt/archives/ {} +",
    );
    expect(body('Collect apt archives')).toContain(
      "find /var/cache/apt/archives -maxdepth 1 -name '*.deb' -exec cp -t ~/.cache/apt-archives/ {} +",
    );

    const installs = ['Install Playwright browsers', 'Install Playwright system dependencies'];
    expect(index('Cache Playwright browsers')).toBeLessThan(index('Cache apt archives'));
    expect(index('Cache apt archives')).toBeLessThan(index('Restore apt archives'));
    for (const install of installs) {
      expect(index('Restore apt archives'), install).toBeLessThan(index(install));
      expect(index(install), install).toBeLessThan(index('Collect apt archives'));
    }
    expect(index('Collect apt archives')).toBeLessThan(index('E2E'));
    for (const name of ['Cache apt archives', 'Restore apt archives', 'Collect apt archives']) {
      expect(body(name), name).not.toMatch(/^\s+if:/m);
    }

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
