import { describe, expect, it } from 'vitest';
import { main } from '../../src/playtest/cli';

const FAST_TIMEOUT_MS = 60_000;

describe('--check-styles on rare mixed spots (TASK-6.31)', () => {
  it(
    'a 1,000-hand Mixed 6-max run lists its rare mixed spots as not judged and passes --check-styles',
    () => {
      let out = '';
      let err = '';
      const code = main(
        ['--hands', '1000', '--seed', '42', '--lineup', 'mixed', '--size', '6', '--check-styles'],
        { out: (t) => (out += t), err: (t) => (err += t) },
      );
      const lines = out.split('\n');
      expect(err).toBe('');
      expect(code).toBe(0);
      const mixed = lines.filter((line) => line.startsWith('Mixed spot: TAG '));
      expect(mixed).toHaveLength(5);
      expect(mixed).toContain('Mixed spot: TAG preflop-limpers, recommended 2, alternative 0');
      expect(mixed).toContain(
        'Mixed spot: TAG preflop-raise-and-calls, recommended 1, alternative 0',
      );
      const last = lines.lastIndexOf(mixed[4] as string);
      expect(lines.slice(last + 1, last + 4)).toEqual([
        'Not judged (fewer than 10 decisions): TAG preflop-limpers',
        'Not judged (fewer than 10 decisions): TAG preflop-raise-and-calls',
        'Style check: passed',
      ]);
      expect(out).not.toMatch(/^(One action only|Outside band):/m);
    },
    FAST_TIMEOUT_MS,
  );
});
