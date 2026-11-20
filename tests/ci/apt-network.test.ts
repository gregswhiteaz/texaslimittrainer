import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const conf = readFileSync(join(REPO_ROOT, 'tools/ci/apt-network.conf'), 'utf8');

const STEP_NAME = 'Bound apt network timeouts';
const STEP_RUN = 'sudo install -m 0644 tools/ci/apt-network.conf /etc/apt/apt.conf.d/99-ci-network';
// apt's maximum backoff between retries (Acquire::Retries::Delay::Maximum default).
const MAX_RETRY_DELAY_SECONDS = 30;
// Install headroom per attempt, as in tests/ci/workflow.test.ts.
const INSTALL_HEADROOM_SECONDS = 60;

describe('apt network limits in CI', () => {
  it('bounds apt network timeouts and retries before the Playwright installs', () => {
    const step = new RegExp(`^ {6}- name: ${STEP_NAME}\\n {8}run: (.+)\\n {6}- name: `, 'm').exec(
      workflow,
    );
    expect(step, 'step with only name and run').not.toBeNull();
    expect(step?.[1]).toBe(STEP_RUN);
    const position = (name: string) => workflow.indexOf(`      - name: ${name}\n`);
    const stepAt = position(STEP_NAME);
    for (const later of [
      'Install dependencies',
      'Install Playwright browsers',
      'Install Playwright system dependencies',
    ]) {
      expect(position(later), later).toBeGreaterThan(stepAt);
    }

    const values = new Map<string, number>();
    for (const line of conf.split('\n')) {
      const text = line.trim();
      if (text === '' || text.startsWith('//')) continue;
      const setting = /^(\S+) "(\d+)";$/.exec(text);
      expect(setting, text).not.toBeNull();
      const [, key = '', value = ''] = setting ?? [];
      values.set(key, Number(value));
    }
    const httpTimeout = values.get('Acquire::http::Timeout') ?? NaN;
    const httpsTimeout = values.get('Acquire::https::Timeout') ?? NaN;
    const retries = values.get('Acquire::Retries') ?? NaN;
    for (const timeout of [httpTimeout, httpsTimeout]) {
      expect(Number.isInteger(timeout)).toBe(true);
      expect(timeout).toBeGreaterThanOrEqual(5);
      expect(timeout).toBeLessThanOrEqual(30);
    }
    expect(Number.isInteger(retries)).toBe(true);
    expect(retries).toBeGreaterThanOrEqual(1);
    expect(retries).toBeLessThanOrEqual(5);

    const attemptSeconds = Number(
      /^ {8}run: node tools\/ci\/retry\.js .*--timeout-seconds (\d+) /m.exec(workflow)?.[1],
    );
    expect(attemptSeconds).toBe(240);
    const worstStall =
      (retries + 1) * Math.max(httpTimeout, httpsTimeout) + retries * MAX_RETRY_DELAY_SECONDS;
    expect(worstStall).toBeLessThanOrEqual(attemptSeconds - INSTALL_HEADROOM_SECONDS);
  });
});

const onGitHubLinux = process.platform === 'linux' && process.env.GITHUB_ACTIONS === 'true';

describe.skipIf(!onGitHubLinux)('apt network limits on the runner (GitHub Actions only)', () => {
  it('the runner apt config contains the network limits', () => {
    const dump = spawnSync('apt-config', ['dump'], { encoding: 'utf8' });
    expect(dump.status, dump.stderr).toBe(0);
    const lines = dump.stdout.split('\n');
    for (const line of [
      'Acquire::http::Timeout "15";',
      'Acquire::https::Timeout "15";',
      'Acquire::Retries "3";',
    ]) {
      expect(lines, line).toContain(line);
    }
  });
});
