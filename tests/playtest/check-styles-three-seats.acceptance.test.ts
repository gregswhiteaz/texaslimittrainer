import { describe, expect, it } from 'vitest';
import { main } from '../../src/playtest/cli';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const SLOW_TIMEOUT_MS = 600_000;

describe('TAG style band at 3 seats (TASK-7.46)', () => {
  it.runIf(SLOW)(
    'all-TAG 3-seat cash play passes --check-styles over 100,000 hands',
    () => {
      let out = '';
      let err = '';
      const code = main(['--hands', '100000', '--seed', '42', '--size', '3', '--check-styles'], {
        out: (t) => (out += t),
        err: (t) => (err += t),
      });
      const tagLine = out.split('\n').find((line) => line.startsWith('Style: TAG, 300000 hands, '));
      console.log(tagLine);
      expect(code).toBe(0);
      expect(err).toBe('');
      expect(out).toContain('Style check: passed\n');
      expect(out).not.toContain('Outside band:');
      expect(tagLine).toBeDefined();
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
