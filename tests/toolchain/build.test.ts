import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

describe('npm run build', () => {
  it(
    'npm run build writes index.html and its script bundle',
    () => {
      const tmp = mkdtempSync(join(tmpdir(), 'tlh-build-'));
      try {
        const outDir = join(tmp, 'out');
        const result = spawnSync(
          'npm',
          ['run', 'build', '--', '--outDir', outDir, '--emptyOutDir'],
          {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            timeout: TOOLCHAIN_TIMEOUT_MS,
          },
        );
        expect(result.status, result.stdout + result.stderr).toBe(0);

        const html = readFileSync(join(outDir, 'index.html'), 'utf8');
        expect(html).toContain('<title>TLH Trainer</title>');
        const script = /src="\/(assets\/[^"]+\.js)"/.exec(html)?.[1];
        expect(script, html).toBeDefined();
        expect(existsSync(join(outDir, script ?? ''))).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
