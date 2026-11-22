import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const SIXTY_MINUTES_MS = 3_600_000;

describe.runIf(process.env.TLH_SLOW_TESTS === '1')('Line-up playtest throughput', () => {
  it(
    '100,000 6-max Mixed hands with style bots finish within 60 minutes with zero violations',
    () => {
      const started = performance.now();
      const result = spawnSync(
        'npm',
        ['run', 'playtest', '--', '--hands', '100000', '--size', '6', '--lineup', 'mixed'],
        {
          cwd: REPO_ROOT,
          env: sandboxEnv(),
          encoding: 'utf8',
          timeout: SIXTY_MINUTES_MS,
        },
      );
      const elapsed = performance.now() - started;
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(elapsed).toBeLessThanOrEqual(SIXTY_MINUTES_MS);
      const lines = result.stdout.split('\n');
      expect(lines).toContain('Hands played: 100000');
      expect(lines).toContain('Invariant violations: 0');
    },
    SIXTY_MINUTES_MS + 60_000,
  );
});
