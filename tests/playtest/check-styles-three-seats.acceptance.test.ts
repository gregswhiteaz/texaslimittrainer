import { describe, expect, it } from 'vitest';
import { main } from '../../src/playtest/cli';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const SLOW_TIMEOUT_MS = 600_000;

describe('TAG style band at 3 seats (TASK-7.46)', () => {
  // The REQ-028 fit criterion judges a mixed spot only when it came up at least 10 times (TASK-6.31),
  // so the run passes the band check and the one-action rule.
  it.runIf(SLOW)(
    'all-TAG 3-seat cash play passes --check-styles over 100,000 hands',
    () => {
      let out = '';
      let err = '';
      const code = main(['--hands', '100000', '--seed', '42', '--size', '3', '--check-styles'], {
        out: (t) => (out += t),
        err: (t) => (err += t),
      });
      const lines = out.split('\n');
      const tagLine = lines.find((line) => line.startsWith('Style: TAG, 300000 hands, '));
      console.log(tagLine);
      console.log(`exit ${code}`);
      console.log(
        lines
          .filter((line) => /^(One action only|Outside band|Style check):/.test(line))
          .join('\n'),
      );
      expect(err).toBe('');
      expect(code).toBe(0);
      expect(lines).toContain('Style check: passed');
      expect(tagLine).toBeDefined();
      expect(out).not.toMatch(/^Outside band: TAG /m);
      expect(out).not.toMatch(/^One action only:/m);
      const match = /aggression (\d+\.\d)% \(band 45\.0-66\.0%\)/.exec(tagLine as string);
      expect(match, tagLine).not.toBeNull();
      const aggression = Number((match as RegExpExecArray)[1]);
      // Above the old 65 ceiling: this run needs the TASK-7.46 band.
      expect(aggression).toBeGreaterThan(65);
      expect(aggression).toBeLessThanOrEqual(66);
    },
    SLOW_TIMEOUT_MS,
  );
});
